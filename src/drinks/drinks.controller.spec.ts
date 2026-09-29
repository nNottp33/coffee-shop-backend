import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { DrinksController } from './drinks.controller'
import { DrinksService } from './drinks.service'

const REQUEST_ID = 'request-1'
const BASE_ID = '11111111-1111-4111-8111-111111111111'
const SIZE_ID = '44444444-4444-4444-8444-444444444444'

describe('DrinksController', () => {
  let app: INestApplication
  const drinksService = { getDrinkQuote: jest.fn() }

  beforeEach(async () => {
    drinksService.getDrinkQuote.mockReset().mockResolvedValue({})

    const moduleRef = await Test.createTestingModule({
      controllers: [DrinksController],
      providers: [{ provide: DrinksService, useValue: drinksService }]
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

  it('answers a quote with 200 because nothing is created', async () => {
    await request(app.getHttpServer())
      .post('/drinks/quote')
      .set('x-api-request-id', REQUEST_ID)
      .send({ base_id: BASE_ID, size_id: SIZE_ID })
      .expect(200)

    expect(drinksService.getDrinkQuote).toHaveBeenCalledWith(REQUEST_ID, {
      base_id: BASE_ID,
      size_id: SIZE_ID,
      ingredient_ids: [],
      quantity: 1
    })
  })

  it('rejects a quote without a size with 400', async () => {
    await request(app.getHttpServer())
      .post('/drinks/quote')
      .send({ base_id: BASE_ID })
      .expect(400)

    expect(drinksService.getDrinkQuote).not.toHaveBeenCalled()
  })
})
