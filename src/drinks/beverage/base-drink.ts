import { IIngredient } from '@/catalog/catalog.interface'
import { DomainError } from '@/common/exception/domain-error.exception'
import { IBeverage, IPriceLine } from '@/drinks/drinks.interface'
import { IngredientCategoryEnum } from '@/utils/constants/catalog.enum'
import { Minor } from '@/utils/functions/money'

export class BaseDrink implements IBeverage {
  constructor(private readonly base: IIngredient) {
    if (base.category !== IngredientCategoryEnum.BASE) {
      throw new DomainError(
        `"${base.name}" is a ${base.category}, not a base drink`
      )
    }
  }

  describe(): string {
    return this.base.name
  }

  cost(): Minor {
    return this.base.price
  }

  breakdown(): IPriceLine[] {
    return [{ label: this.base.name, amount: this.base.price }]
  }
}
