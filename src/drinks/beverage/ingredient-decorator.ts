import { IIngredient } from '@/catalog/catalog.interface'
import { DomainError } from '@/common/exception/domain-error.exception'
import { IBeverage, IPriceLine } from '@/drinks/drinks.interface'
import { IngredientCategoryEnum } from '@/utils/constants/catalog.enum'
import { Minor } from '@/utils/functions/money'

export class IngredientDecorator implements IBeverage {
  constructor(
    private readonly inner: IBeverage,
    private readonly ingredient: IIngredient
  ) {
    if (ingredient.category === IngredientCategoryEnum.BASE) {
      throw new DomainError(
        `"${ingredient.name}" is a base drink and cannot be added as an extra`
      )
    }
  }

  describe(): string {
    return `${this.inner.describe()}, ${this.ingredient.name}`
  }

  cost(): Minor {
    return this.inner.cost() + this.ingredient.price
  }

  breakdown(): IPriceLine[] {
    return [
      ...this.inner.breakdown(),
      { label: this.ingredient.name, amount: this.ingredient.price }
    ]
  }
}
