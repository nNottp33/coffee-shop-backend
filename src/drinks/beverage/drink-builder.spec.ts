import { IIngredient, ISize } from '@/catalog/catalog.interface'
import { IngredientCategoryEnum } from '@/utils/constants/catalog.enum'
import { DrinkBuilder } from './drink-builder'

const createIngredient = (
  name: string,
  category: IngredientCategoryEnum,
  price: number
): IIngredient => ({
  id: name.toLowerCase(),
  code: name.toUpperCase().replace(/ /g, '_'),
  name,
  category,
  price
})

const coffee = createIngredient('Coffee', IngredientCategoryEnum.BASE, 5000)
const tea = createIngredient('Tea', IngredientCategoryEnum.BASE, 4000)
const vanilla = createIngredient('Vanilla', IngredientCategoryEnum.SYRUP, 1000)
const whip = createIngredient(
  'Whipped Cream',
  IngredientCategoryEnum.TOPPING,
  1500
)
const cinnamon = createIngredient(
  'Cinnamon',
  IngredientCategoryEnum.TOPPING,
  500
)

const small: ISize = { id: 's', code: 'S', name: 'Small', surcharge: 0 }
const large: ISize = { id: 'l', code: 'L', name: 'Large', surcharge: 2000 }

describe('DrinkBuilder + decorators', () => {
  it('describes and prices a plain drink', () => {
    const drink = DrinkBuilder.create().withBase(coffee).withSize(small).build()
    expect(drink.describe()).toBe('Small Coffee')
    expect(drink.cost()).toBe(5000)
  })

  it('supports duplicate ingredients (double vanilla) and keeps insertion order', () => {
    const drink = DrinkBuilder.create()
      .withBase(coffee)
      .add(vanilla)
      .add(vanilla)
      .add(whip)
      .withSize(large)
      .build()

    expect(drink.describe()).toBe(
      'Large Coffee, Vanilla, Vanilla, Whipped Cream'
    )
    expect(drink.cost()).toBe(5000 + 1000 + 1000 + 1500 + 2000)
    expect(drink.breakdown()).toEqual([
      { label: 'Coffee', amount: 5000 },
      { label: 'Vanilla', amount: 1000 },
      { label: 'Vanilla', amount: 1000 },
      { label: 'Whipped Cream', amount: 1500 },
      { label: 'Size: Large', amount: 2000 }
    ])
  })

  it('omits the size line from the breakdown when there is no surcharge', () => {
    const drink = DrinkBuilder.create()
      .withBase(tea)
      .add(cinnamon)
      .withSize(small)
      .build()
    expect(drink.breakdown()).toEqual([
      { label: 'Tea', amount: 4000 },
      { label: 'Cinnamon', amount: 500 }
    ])
  })

  it('rejects a drink without a base or a size', () => {
    expect(() => DrinkBuilder.create().withSize(small).build()).toThrow(/base/)
    expect(() => DrinkBuilder.create().withBase(coffee).build()).toThrow(/size/)
  })

  it('rejects using a syrup as a base or a base as an extra', () => {
    expect(() =>
      DrinkBuilder.create().withBase(vanilla).withSize(small).build()
    ).toThrow(/not a base/)
    expect(() =>
      DrinkBuilder.create().withBase(coffee).add(tea).withSize(small).build()
    ).toThrow(/cannot be added/)
  })
})
