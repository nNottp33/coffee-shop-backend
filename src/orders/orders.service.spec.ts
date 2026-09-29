import { HttpException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { IIngredient, ISize } from '@/catalog/catalog.interface'
import { CatalogService } from '@/catalog/catalog.service'
import { OrderEntity } from '@/common/database/entity/order.entity'
import { ExceptionService } from '@/common/exception/exception.service'
import { DrinksService } from '@/drinks/drinks.service'
import { IngredientCategoryEnum } from '@/utils/constants/catalog.enum'
import { messageError } from '@/utils/constants/messageError'
import { OrdersService } from './orders.service'

const REQUEST_ID = 'request-1'

const createIngredient = (
  id: string,
  name: string,
  category: IngredientCategoryEnum,
  price: number
): IIngredient => ({
  id,
  code: name.toUpperCase(),
  name,
  category,
  price
})

const COFFEE = createIngredient(
  '11111111-1111-4111-8111-111111111111',
  'Coffee',
  IngredientCategoryEnum.BASE,
  5000
)
const VANILLA = createIngredient(
  '22222222-2222-4222-8222-222222222222',
  'Vanilla',
  IngredientCategoryEnum.SYRUP,
  1000
)
const LARGE: ISize = {
  id: '44444444-4444-4444-8444-444444444444',
  code: 'L',
  name: 'Large',
  surcharge: 2000
}
const MISSING_ID = '99999999-9999-4999-8999-999999999999'

describe('OrdersService', () => {
  let service: OrdersService
  const catalogService = {
    findIngredientByIds: jest.fn(),
    findSizeByIds: jest.fn()
  }
  const orderRepository = { find: jest.fn(), findOne: jest.fn() }
  const saved: unknown[] = []
  const errorLogs: unknown[][] = []

  beforeEach(async () => {
    saved.length = 0
    errorLogs.length = 0
    orderRepository.find.mockReset()
    orderRepository.findOne.mockReset()
    catalogService.findIngredientByIds
      .mockReset()
      .mockResolvedValue(
        new Map(
          [COFFEE, VANILLA].map((ingredient) => [ingredient.id, ingredient])
        )
      )
    catalogService.findSizeByIds
      .mockReset()
      .mockResolvedValue(new Map([[LARGE.id, LARGE]]))

    const manager = {
      create: jest.fn((_: unknown, value: Record<string, unknown>) => value),
      save: jest.fn(async (value: Record<string, unknown>) => {
        const row = {
          ...value,
          id: 'order-1',
          order_number: 7,
          created_at: new Date('2026-01-01')
        }
        saved.push(row)

        return row
      })
    }
    const dataSource = {
      transaction: jest.fn(
        (callback: (entityManager: typeof manager) => unknown) =>
          callback(manager)
      )
    }

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        DrinksService,
        ExceptionService,
        { provide: CatalogService, useValue: catalogService },
        { provide: DataSource, useValue: dataSource },
        { provide: getRepositoryToken(OrderEntity), useValue: orderRepository }
      ]
    }).compile()
    moduleRef.useLogger({
      log: jest.fn(),
      warn: (...messages: unknown[]) => errorLogs.push(messages),
      error: (...messages: unknown[]) => errorLogs.push(messages)
    })

    service = moduleRef.get(OrdersService)
  })

  it('answers 500 without the cause and keeps the customer out of the log', async () => {
    catalogService.findIngredientByIds.mockRejectedValue(
      new Error('connection to database lost')
    )

    await expect(
      service.createOrder(REQUEST_ID, {
        customer_name: 'Nattapon',
        items: [
          {
            base_id: COFFEE.id,
            size_id: LARGE.id,
            ingredient_ids: [],
            quantity: 1
          }
        ]
      })
    ).rejects.toMatchObject({
      response: {
        status: 500,
        message: 'Internal Server Error',
        code: 'INTERNAL_SERVER_ERROR'
      }
    })
    expect(saved).toHaveLength(0)
    expect(errorLogs).toHaveLength(1)
    expect(JSON.stringify(errorLogs)).toContain(REQUEST_ID)
    expect(JSON.stringify(errorLogs)).toContain(COFFEE.id)
    expect(JSON.stringify(errorLogs)).not.toContain('Nattapon')
  })

  it('answers 400 when a line breaks a domain rule', async () => {
    await expect(
      service.createOrder(REQUEST_ID, {
        items: [
          {
            base_id: COFFEE.id,
            size_id: LARGE.id,
            ingredient_ids: [COFFEE.id],
            quantity: 1
          }
        ]
      })
    ).rejects.toMatchObject({
      response: {
        status: 400,
        message: '"Coffee" is a base drink and cannot be added as an extra',
        code: 'BAD_REQUEST'
      }
    })
    expect(saved).toHaveLength(0)
  })

  it('places an order and returns an itemised receipt with a grand total', async () => {
    const response = await service.createOrder(REQUEST_ID, {
      customer_name: '  Nat ',
      items: [
        {
          base_id: COFFEE.id,
          size_id: LARGE.id,
          ingredient_ids: [VANILLA.id, VANILLA.id],
          quantity: 2
        },
        {
          base_id: COFFEE.id,
          size_id: LARGE.id,
          ingredient_ids: [],
          quantity: 1
        }
      ]
    })
    const receipt = response.result!

    expect(response).toMatchObject({
      status: 201,
      code: 'SUCCESSFULLY',
      message: 'create order number 7 successfully'
    })
    expect(receipt.order_number).toBe(7)
    expect(receipt.customer_name).toBe('Nat')
    expect(receipt.items).toHaveLength(2)
    expect(receipt.items[0]).toMatchObject({
      description: 'Large Coffee, Vanilla, Vanilla',
      unit_price: 90,
      quantity: 2,
      line_total: 180
    })
    expect(receipt.items[1].line_total).toBe(70)
    expect(receipt.grand_total).toBe(250)
    expect(receipt.currency).toBe('THB')

    const row = saved[0] as {
      grand_total_minor: number
      customer_name: string
      items: unknown[]
    }
    expect(row.grand_total_minor).toBe(25000)
    expect(row.customer_name).toBe('Nat')
    expect(row.items[0]).toMatchObject({
      position: 0,
      base: { id: COFFEE.id },
      size: { id: LARGE.id },
      base_name_snapshot: 'Coffee',
      base_price_minor_snapshot: 5000,
      size_name_snapshot: 'Large',
      size_surcharge_minor_snapshot: 2000,
      description: 'Large Coffee, Vanilla, Vanilla',
      quantity: 2,
      unit_price_minor: 9000,
      line_total_minor: 18000,
      ingredients: [
        {
          ingredient: { id: VANILLA.id },
          position: 0,
          name_snapshot: 'Vanilla',
          price_minor_snapshot: 1000
        },
        {
          ingredient: { id: VANILLA.id },
          position: 1,
          name_snapshot: 'Vanilla',
          price_minor_snapshot: 1000
        }
      ]
    })
  })

  it('reads the catalog once per order so totals and snapshots agree', async () => {
    await service.createOrder(REQUEST_ID, {
      items: [
        {
          base_id: COFFEE.id,
          size_id: LARGE.id,
          ingredient_ids: [VANILLA.id],
          quantity: 1
        }
      ]
    })

    expect(catalogService.findIngredientByIds).toHaveBeenCalledTimes(1)
    expect(catalogService.findSizeByIds).toHaveBeenCalledTimes(1)
  })

  it('saves nothing when the catalog does not know an id', async () => {
    const message = `Unknown ingredient id(s): ${MISSING_ID}`
    catalogService.findIngredientByIds.mockRejectedValue(
      new HttpException({ ...messageError.INGREDIENT_NOT_FOUND, message }, 404)
    )

    await expect(
      service.createOrder(REQUEST_ID, {
        items: [
          {
            base_id: COFFEE.id,
            size_id: LARGE.id,
            ingredient_ids: [MISSING_ID],
            quantity: 1
          }
        ]
      })
    ).rejects.toMatchObject({
      response: { status: 404, message, code: 'INGREDIENT_NOT_FOUND' }
    })
    expect(saved).toHaveLength(0)
  })

  it('rebuilds a stored receipt from its snapshots in position order', async () => {
    orderRepository.findOne.mockResolvedValue({
      id: 'order-1',
      order_number: 7,
      customer_name: null,
      grand_total_minor: 10500,
      created_at: new Date('2026-01-01'),
      items: [
        {
          position: 0,
          description: 'Large Coffee, Vanilla, Vanilla, Whipped Cream',
          quantity: 1,
          unit_price_minor: 10500,
          line_total_minor: 10500,
          base_name_snapshot: 'Coffee',
          base_price_minor_snapshot: 5000,
          size_name_snapshot: 'Large',
          size_surcharge_minor_snapshot: 2000,
          ingredients: [
            {
              position: 2,
              name_snapshot: 'Whipped Cream',
              price_minor_snapshot: 1500
            },
            {
              position: 0,
              name_snapshot: 'Vanilla',
              price_minor_snapshot: 1000
            },
            {
              position: 1,
              name_snapshot: 'Vanilla',
              price_minor_snapshot: 1000
            }
          ]
        }
      ]
    })

    const response = await service.getOrderById(REQUEST_ID, 'order-1')

    expect(response).toMatchObject({
      status: 200,
      code: 'SUCCESSFULLY',
      result: {
        order_number: 7,
        grand_total: 105,
        items: [
          {
            description: 'Large Coffee, Vanilla, Vanilla, Whipped Cream',
            unit_price: 105,
            line_total: 105,
            breakdown: [
              { label: 'Coffee', amount: 50 },
              { label: 'Vanilla', amount: 10 },
              { label: 'Vanilla', amount: 10 },
              { label: 'Whipped Cream', amount: 15 },
              { label: 'Size: Large', amount: 20 }
            ]
          }
        ]
      }
    })
  })

  it('lists orders with a default of 50 and clamps the limit to 1-200', async () => {
    orderRepository.find.mockResolvedValue([])

    await service.getOrders(REQUEST_ID)
    await service.getOrders(REQUEST_ID, 0)
    await service.getOrders(REQUEST_ID, 999)
    const response = await service.getOrders(REQUEST_ID, 7)

    const takes = orderRepository.find.mock.calls.map(
      ([options]) => options.take
    )
    expect(takes).toEqual([50, 1, 200, 7])
    expect(response).toEqual({
      status: 200,
      code: 'SUCCESSFULLY',
      message: 'get orders successfully',
      result: []
    })
  })

  it('rejects an unknown order id with 404', async () => {
    orderRepository.findOne.mockResolvedValue(null)

    const result = service.getOrderById(REQUEST_ID, MISSING_ID)

    await expect(result).rejects.toMatchObject({
      response: {
        status: 404,
        message: `Order ${MISSING_ID} not found`,
        code: 'ORDER_NOT_FOUND'
      }
    })
  })
})
