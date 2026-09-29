import { IIngredient, ISize } from '@/catalog/catalog.interface'
import { DomainError } from '@/common/exception/domain-error.exception'
import { IBeverage } from '@/drinks/drinks.interface'
import { BaseDrink } from './base-drink'
import { IngredientDecorator } from './ingredient-decorator'
import { SizeDecorator } from './size-decorator'

export class DrinkBuilder {
  private base?: IIngredient
  private size?: ISize
  private readonly extras: IIngredient[] = []

  static create(): DrinkBuilder {
    return new DrinkBuilder()
  }

  withBase(base: IIngredient): this {
    this.base = base

    return this
  }

  withSize(size: ISize): this {
    this.size = size

    return this
  }

  add(ingredient: IIngredient): this {
    this.extras.push(ingredient)

    return this
  }

  addAll(ingredients: Iterable<IIngredient>): this {
    for (const ingredient of ingredients) {
      this.add(ingredient)
    }

    return this
  }

  build(): IBeverage {
    if (!this.base) {
      throw new DomainError('A drink needs a base')
    }
    if (!this.size) {
      throw new DomainError('A drink needs exactly one size')
    }

    let beverage: IBeverage = new BaseDrink(this.base)
    for (const extra of this.extras) {
      beverage = new IngredientDecorator(beverage, extra)
    }

    return new SizeDecorator(beverage, this.size)
  }
}
