import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ExceptionService } from '@/common/exception/exception.service'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'

const REQUEST_ID = 'request-1'
const BASE_ID = '11111111-1111-4111-8111-111111111111'
const SIZE_ID = '44444444-4444-4444-8444-444444444444'

describe('OrdersController', () => {
  let app: INestApplication
  const ordersService = {
    createOrder: jest.fn(),
    getOrders: jest.fn()
  }

  beforeEach(async () => {
    ordersService.createOrder.mockReset().mockResolvedValue({})
    ordersService.getOrders.mockReset().mockResolvedValue([])

    const moduleRef = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        ExceptionService,
        { provide: OrdersService, useValue: ordersService }
      ]
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
      })
    )
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it.each([
    ['5', 5],
    ['2.7', 2],
    ['0', 0],
    ['999', 999]
  ])('passes limit=%s to the service as %d', async (limit, expected) => {
    await request(app.getHttpServer())
      .get(`/orders?limit=${limit}`)
      .set('x-api-request-id', REQUEST_ID)
      .expect(200)

    expect(ordersService.getOrders).toHaveBeenCalledWith(REQUEST_ID, expected)
  })

  it.each(['/orders', '/orders?limit=', '/orders?limit=%20'])(
    'lets the service pick the default for %s',
    async (path) => {
      await request(app.getHttpServer())
        .get(path)
        .set('x-api-request-id', REQUEST_ID)
        .expect(200)

      expect(ordersService.getOrders).toHaveBeenCalledWith(
        REQUEST_ID,
        undefined
      )
    }
  )

  it.each(['limit=abc', 'limit=12abc', 'limit=1&limit=2'])(
    'rejects %s with 400 because it is not a number',
    async (query) => {
      const response = await request(app.getHttpServer())
        .get(`/orders?${query}`)
        .expect(400)

      expect(response.body).toEqual({
        status: 400,
        message: 'limit must be a number',
        code: 'LIMIT_INVALID'
      })
      expect(ordersService.getOrders).not.toHaveBeenCalled()
    }
  )

  it('answers a placed order with 201', async () => {
    await request(app.getHttpServer())
      .post('/orders')
      .set('x-api-request-id', REQUEST_ID)
      .send({ items: [{ base_id: BASE_ID, size_id: SIZE_ID }] })
      .expect(201)

    expect(ordersService.createOrder).toHaveBeenCalledWith(REQUEST_ID, {
      items: [
        { base_id: BASE_ID, size_id: SIZE_ID, ingredient_ids: [], quantity: 1 }
      ]
    })
  })

  it('works without a request id header', async () => {
    await request(app.getHttpServer()).get('/orders?limit=5').expect(200)

    expect(ordersService.getOrders).toHaveBeenCalledWith(undefined, 5)
  })
})
