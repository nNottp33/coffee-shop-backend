import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { IngredientEntity } from '@/common/database/entity/ingredient.entity'
import { SizeEntity } from '@/common/database/entity/size.entity'
import { ExceptionService } from '@/common/exception/exception.service'
import { IngredientCategoryEnum } from '@/utils/constants/catalog.enum'
import { CatalogService } from './catalog.service'

const REQUEST_ID = 'request-1'

const createIngredientEntity = (
  id: string,
  name: string,
  category: IngredientCategoryEnum,
  priceMinor: number
): IngredientEntity => ({
  id,
  code: name.toUpperCase(),
  name,
  category,
  price_minor: priceMinor,
  is_active: true,
  sort_order: 1,
  created_at: new Date('2026-01-01')
})

const COFFEE = createIngredientEntity(
  '11111111-1111-4111-8111-111111111111',
  'Coffee',
  IngredientCategoryEnum.BASE,
  5000
)
const VANILLA = createIngredientEntity(
  '22222222-2222-4222-8222-222222222222',
  'Vanilla',
  IngredientCategoryEnum.SYRUP,
  1000
)
const CINNAMON = createIngredientEntity(
  '33333333-3333-4333-8333-333333333333',
  'Cinnamon',
  IngredientCategoryEnum.TOPPING,
  500
)
const LARGE: SizeEntity = {
  id: '44444444-4444-4444-8444-444444444444',
  code: 'L',
  name: 'Large',
  surcharge_minor: 2000,
  is_active: true,
  sort_order: 3,
  created_at: new Date('2026-01-01')
}
const MISSING_ID = '99999999-9999-4999-8999-999999999999'

describe('CatalogService', () => {
  let service: CatalogService
  const ingredientRepository = { find: jest.fn() }
  const sizeRepository = { find: jest.fn() }

  beforeEach(async () => {
    ingredientRepository.find.mockReset()
    sizeRepository.find.mockReset()

    const moduleRef = await Test.createTestingModule({
      providers: [
        CatalogService,
        ExceptionService,
        {
          provide: getRepositoryToken(IngredientEntity),
          useValue: ingredientRepository
        },
        { provide: getRepositoryToken(SizeEntity), useValue: sizeRepository }
      ]
    }).compile()
    moduleRef.useLogger(false)

    service = moduleRef.get(CatalogService)
  })

  it('groups ingredients by category and returns prices in major units', async () => {
    ingredientRepository.find.mockResolvedValue([COFFEE, VANILLA, CINNAMON])
    sizeRepository.find.mockResolvedValue([LARGE])

    const response = await service.getCatalog(REQUEST_ID)

    expect(response).toEqual({
      status: 200,
      code: 'SUCCESSFULLY',
      message: 'get catalog successfully',
      result: {
        bases: [
          {
            id: COFFEE.id,
            code: 'COFFEE',
            name: 'Coffee',
            category: IngredientCategoryEnum.BASE,
            price: 50
          }
        ],
        syrups: [
          {
            id: VANILLA.id,
            code: 'VANILLA',
            name: 'Vanilla',
            category: IngredientCategoryEnum.SYRUP,
            price: 10
          }
        ],
        toppings: [
          {
            id: CINNAMON.id,
            code: 'CINNAMON',
            name: 'Cinnamon',
            category: IngredientCategoryEnum.TOPPING,
            price: 5
          }
        ],
        sizes: [{ id: LARGE.id, code: 'L', name: 'Large', surcharge: 20 }]
      }
    })
    expect(Object.keys(response.result!.bases[0])).toEqual([
      'id',
      'code',
      'name',
      'category',
      'price'
    ])
  })

  it('answers 500 without the cause when the catalog cannot be read', async () => {
    ingredientRepository.find.mockRejectedValue(new Error('connection lost'))
    sizeRepository.find.mockResolvedValue([])

    await expect(service.getCatalog(REQUEST_ID)).rejects.toMatchObject({
      response: {
        status: 500,
        message: 'Internal Server Error',
        code: 'INTERNAL_SERVER_ERROR'
      }
    })
  })

  it('resolves ingredient ids to value objects priced in minor units', async () => {
    ingredientRepository.find.mockResolvedValue([COFFEE, VANILLA])

    const ingredientMap = await service.findIngredientByIds([
      COFFEE.id,
      VANILLA.id,
      VANILLA.id
    ])

    expect(ingredientMap.size).toBe(2)
    expect(ingredientMap.get(VANILLA.id)).toEqual({
      id: VANILLA.id,
      code: 'VANILLA',
      name: 'Vanilla',
      category: IngredientCategoryEnum.SYRUP,
      price: 1000
    })
  })

  it('finds ingredients and sizes when the ids arrive in upper case', async () => {
    const caramel = createIngredientEntity(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'Caramel',
      IngredientCategoryEnum.SYRUP,
      1000
    )
    const medium: SizeEntity = {
      ...LARGE,
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      code: 'M',
      name: 'Medium',
      surcharge_minor: 1000
    }
    const caramelId = caramel.id.toUpperCase()
    const mediumId = medium.id.toUpperCase()
    ingredientRepository.find.mockResolvedValue([caramel])
    sizeRepository.find.mockResolvedValue([medium])

    const ingredientMap = await service.findIngredientByIds([caramelId])
    const sizeMap = await service.findSizeByIds([mediumId])

    expect(ingredientMap.get(caramelId)).toMatchObject({
      id: caramel.id,
      name: 'Caramel'
    })
    expect(sizeMap.get(mediumId)).toMatchObject({
      id: medium.id,
      name: 'Medium'
    })
  })

  it('rejects unknown ingredient ids with 404 and names them', async () => {
    ingredientRepository.find.mockResolvedValue([COFFEE])

    const result = service.findIngredientByIds([COFFEE.id, MISSING_ID])

    await expect(result).rejects.toMatchObject({
      response: {
        status: 404,
        message: `Unknown ingredient id(s): ${MISSING_ID}`,
        code: 'INGREDIENT_NOT_FOUND'
      }
    })
  })

  it('rejects unknown size ids with 404 and names them', async () => {
    sizeRepository.find.mockResolvedValue([])

    const result = service.findSizeByIds([MISSING_ID])

    await expect(result).rejects.toMatchObject({
      response: {
        status: 404,
        message: `Unknown size id(s): ${MISSING_ID}`,
        code: 'SIZE_NOT_FOUND'
      }
    })
  })

  it('skips the query when no ids are given', async () => {
    const ingredientMap = await service.findIngredientByIds([])

    expect(ingredientMap.size).toBe(0)
    expect(ingredientRepository.find).not.toHaveBeenCalled()
  })
})
