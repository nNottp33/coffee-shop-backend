import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { DataSource } from 'typeorm'
import { AppModule } from '@/app.module'
import { TableEnum } from '@/utils/constants/enum'

interface ICatalogItem {
  id: string
  name: string
}

describe('Coffee shop (e2e)', () => {
  let app: INestApplication
  let dataSource: DataSource
  let coffeeId: string
  let teaId: string
  let vanillaId: string
  let whipId: string
  let smallId: string
  let largeId: string
  const orderIds: string[] = []

  const findId = (items: ICatalogItem[], name: string): string => {
    return items.find((item) => item.name === name)!.id
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()
    moduleRef.useLogger(false)

    app = moduleRef.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
      })
    )
    await app.init()

    dataSource = app.get(DataSource)
    await dataSource.runMigrations()

    const { body } = await request(app.getHttpServer())
      .get('/api/catalog')
      .expect(200)
    const { bases, syrups, toppings, sizes } = body.result
    coffeeId = findId(bases, 'Coffee')
    teaId = findId(bases, 'Tea')
    vanillaId = findId(syrups, 'Vanilla')
    whipId = findId(toppings, 'Whipped Cream')
    smallId = findId(sizes, 'Small')
    largeId = findId(sizes, 'Large')
  })

  afterAll(async () => {
    if (orderIds.length) {
      await dataSource
        .createQueryBuilder()
        .delete()
        .from(TableEnum.ORDERS)
        .whereInIds(orderIds)
        .execute()
    }
    await app.close()
  })

  it('offers every base, syrup, topping and size of the assignment', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/api/catalog')
      .expect(200)
    const getNames = (items: ICatalogItem[]): string[] => {
      return items.map((item) => item.name)
    }

    expect(body).toMatchObject({ status: 200, code: 'SUCCESSFULLY' })
    expect(getNames(body.result.bases)).toEqual(['Coffee', 'Tea', 'Milk'])
    expect(getNames(body.result.syrups)).toEqual([
      'Vanilla',
      'Caramel',
      'Chocolate'
    ])
    expect(getNames(body.result.toppings)).toEqual([
      'Whipped Cream',
      'Cinnamon',
      'Marshmallows'
    ])
    expect(getNames(body.result.sizes)).toEqual(['Small', 'Medium', 'Large'])
  })

  it('describes and prices a double vanilla coffee', async () => {
    const { body } = await request(app.getHttpServer())
      .post('/api/drinks/quote')
      .send({
        base_id: coffeeId,
        size_id: largeId,
        ingredient_ids: [vanillaId, vanillaId, whipId]
      })
      .expect(200)

    expect(body.result).toEqual({
      description: 'Large Coffee, Vanilla, Vanilla, Whipped Cream',
      unit_price: 105,
      breakdown: [
        { label: 'Coffee', amount: 50 },
        { label: 'Vanilla', amount: 10 },
        { label: 'Vanilla', amount: 10 },
        { label: 'Whipped Cream', amount: 15 },
        { label: 'Size: Large', amount: 20 }
      ]
    })
  })

  it('places an order and reads the same receipt back', async () => {
    const { body } = await request(app.getHttpServer())
      .post('/api/orders')
      .send({
        customer_name: 'e2e',
        items: [
          {
            base_id: coffeeId,
            size_id: largeId,
            ingredient_ids: [vanillaId, vanillaId, whipId],
            quantity: 2
          },
          { base_id: teaId, size_id: smallId }
        ]
      })
      .expect(201)
    const receipt = body.result
    orderIds.push(receipt.id)

    expect(body).toMatchObject({ status: 201, code: 'SUCCESSFULLY' })
    expect(receipt).toMatchObject({
      customer_name: 'e2e',
      currency: 'THB',
      grand_total: 250,
      items: [
        {
          description: 'Large Coffee, Vanilla, Vanilla, Whipped Cream',
          unit_price: 105,
          quantity: 2,
          line_total: 210
        },
        {
          description: 'Small Tea',
          unit_price: 40,
          quantity: 1,
          line_total: 40
        }
      ]
    })

    const stored = await request(app.getHttpServer())
      .get(`/api/orders/${receipt.id}`)
      .expect(200)

    expect(stored.body.result.grand_total).toBe(250)
    expect(stored.body.result.items).toEqual(receipt.items)

    const listed = await request(app.getHttpServer())
      .get('/api/orders?limit=1')
      .expect(200)

    expect(listed.body.result).toHaveLength(1)
    expect(listed.body.result[0]).toEqual(stored.body.result)
  })

  it('accepts as many repeats of a topping as the quote allows', async () => {
    const ingredientIds = Array.from({ length: 50 }, () => whipId)

    const { body } = await request(app.getHttpServer())
      .post('/api/orders')
      .send({
        items: [
          {
            base_id: coffeeId,
            size_id: largeId,
            ingredient_ids: ingredientIds
          }
        ]
      })
      .expect(201)
    orderIds.push(body.result.id)

    expect(body.result.grand_total).toBe(50 + 50 * 15 + 20)
    expect(body.result.items[0].breakdown).toHaveLength(52)
  })

  it('rejects a drink without a size with 400', async () => {
    await request(app.getHttpServer())
      .post('/api/drinks/quote')
      .send({ base_id: coffeeId })
      .expect(400)
  })

  it('rejects a syrup used as the base with 400', async () => {
    const { body } = await request(app.getHttpServer())
      .post('/api/drinks/quote')
      .send({ base_id: vanillaId, size_id: largeId })
      .expect(400)

    expect(body).toEqual({
      status: 400,
      message: '"Vanilla" is a syrup, not a base drink',
      code: 'BAD_REQUEST'
    })
  })

  it('rejects an unknown ingredient with 404', async () => {
    const missingId = '99999999-9999-4999-8999-999999999999'

    const { body } = await request(app.getHttpServer())
      .post('/api/drinks/quote')
      .send({ base_id: missingId, size_id: largeId })
      .expect(404)

    expect(body).toEqual({
      status: 404,
      message: `Unknown ingredient id(s): ${missingId}`,
      code: 'INGREDIENT_NOT_FOUND'
    })
  })
})
