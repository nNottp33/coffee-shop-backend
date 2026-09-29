import { IIngredient, ISize } from '@/catalog/catalog.interface'
import { DrinkBuilder } from '@/drinks/beverage'
import { IngredientCategoryEnum } from '@/utils/constants/catalog.enum'
import { Order, OrderLine } from './order'

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
const caramel = createIngredient('Caramel', IngredientCategoryEnum.SYRUP, 1000)

const small: ISize = { id: 's', code: 'S', name: 'Small', surcharge: 0 }
const large: ISize = { id: 'l', code: 'L', name: 'Large', surcharge: 2000 }

describe('Order', () => {
  it('computes line totals and a grand total', () => {
    const latte = DrinkBuilder.create()
      .withBase(coffee)
      .add(caramel)
      .withSize(large)
      .build()
    const plainTea = DrinkBuilder.create().withBase(tea).withSize(small).build()

    const order = new Order([
      new OrderLine(latte, 2),
      new OrderLine(plainTea, 1)
    ])

    expect(order.lines[0].lineTotal).toBe((5000 + 1000 + 2000) * 2)
    expect(order.grandTotal).toBe((5000 + 1000 + 2000) * 2 + 4000)
  })

  it('rejects an empty order and a non-positive quantity', () => {
    expect(() => new Order([])).toThrow(/at least one/)
    const plainTea = DrinkBuilder.create().withBase(tea).withSize(small).build()
    expect(() => new OrderLine(plainTea, 0)).toThrow(/positive/)
  })
})
