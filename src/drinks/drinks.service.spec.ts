import { HttpException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { IIngredient, ISize } from '@/catalog/catalog.interface'
import { CatalogService } from '@/catalog/catalog.service'
import { ExceptionService } from '@/common/exception/exception.service'
import { IngredientCategoryEnum } from '@/utils/constants/catalog.enum'
import { messageError } from '@/utils/constants/messageError'
import { DrinksService } from './drinks.service'

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
const WHIP = createIngredient(
  '33333333-3333-4333-8333-333333333333',
  'Whipped Cream',
  IngredientCategoryEnum.TOPPING,
  1500
)
const LARGE: ISize = {
  id: '44444444-4444-4444-8444-444444444444',
  code: 'L',
  name: 'Large',
  surcharge: 2000
}
const MISSING_ID = '99999999-9999-4999-8999-999999999999'

describe('DrinksService', () => {
  let service: DrinksService
  const catalogService = {
    findIngredientByIds: jest.fn(),
    findSizeByIds: jest.fn()
  }

  beforeEach(async () => {
    catalogService.findIngredientByIds
      .mockReset()
      .mockResolvedValue(
        new Map(
          [COFFEE, VANILLA, WHIP].map((ingredient) => [
            ingredient.id,
            ingredient
          ])
        )
      )
    catalogService.findSizeByIds
      .mockReset()
      .mockResolvedValue(new Map([[LARGE.id, LARGE]]))

    const moduleRef = await Test.createTestingModule({
      providers: [
        DrinksService,
        ExceptionService,
        { provide: CatalogService, useValue: catalogService }
      ]
    }).compile()
    moduleRef.useLogger(false)

    service = moduleRef.get(DrinksService)
  })

  it('quotes a customised drink with a description and breakdown', async () => {
    const response = await service.getDrinkQuote(REQUEST_ID, {
      base_id: COFFEE.id,
      size_id: LARGE.id,
      ingredient_ids: [VANILLA.id, VANILLA.id, WHIP.id],
      quantity: 1
    })

    expect(response).toEqual({
      status: 200,
      code: 'SUCCESSFULLY',
      message: 'get drink quote successfully',
      result: {
        description: 'Large Coffee, Vanilla, Vanilla, Whipped Cream',
        unit_price: 105,
        breakdown: [
          { label: 'Coffee', amount: 50 },
          { label: 'Vanilla', amount: 10 },
          { label: 'Vanilla', amount: 10 },
          { label: 'Whipped Cream', amount: 15 },
          { label: 'Size: Large', amount: 20 }
        ]
      }
    })
  })

  it('asks the catalog for every base, extra and size in one round', async () => {
    const { beverages } = await service.buildBeverages([
      {
        base_id: COFFEE.id,
        size_id: LARGE.id,
        ingredient_ids: [VANILLA.id],
        quantity: 1
      },
      {
        base_id: COFFEE.id,
        size_id: LARGE.id,
        ingredient_ids: [],
        quantity: 2
      }
    ])

    expect(beverages.map((beverage) => beverage.describe())).toEqual([
      'Large Coffee, Vanilla',
      'Large Coffee'
    ])
    expect(catalogService.findIngredientByIds).toHaveBeenCalledTimes(1)
    expect(catalogService.findIngredientByIds).toHaveBeenCalledWith([
      COFFEE.id,
      VANILLA.id,
      COFFEE.id
    ])
    expect(catalogService.findSizeByIds).toHaveBeenCalledWith([
      LARGE.id,
      LARGE.id
    ])
  })

  it('propagates the 404 raised by the catalog', async () => {
    const message = `Unknown ingredient id(s): ${MISSING_ID}`
    catalogService.findIngredientByIds.mockRejectedValue(
      new HttpException({ ...messageError.INGREDIENT_NOT_FOUND, message }, 404)
    )

    await expect(
      service.getDrinkQuote(REQUEST_ID, {
        base_id: COFFEE.id,
        size_id: LARGE.id,
        ingredient_ids: [MISSING_ID],
        quantity: 1
      })
    ).rejects.toMatchObject({
      response: { status: 404, message, code: 'INGREDIENT_NOT_FOUND' }
    })
  })

  it('answers 400 when a syrup is used as the base', async () => {
    await expect(
      service.getDrinkQuote(REQUEST_ID, {
        base_id: VANILLA.id,
        size_id: LARGE.id,
        ingredient_ids: [],
        quantity: 1
      })
    ).rejects.toMatchObject({
      response: {
        status: 400,
        message: '"Vanilla" is a syrup, not a base drink',
        code: 'BAD_REQUEST'
      }
    })
  })
})
