import { IIngredient, ISize } from '@/catalog/catalog.interface'
import { Minor } from '@/utils/functions/money'

export interface IPriceLine {
  label: string
  amount: Minor
}

export interface IBeverage {
  describe(): string
  cost(): Minor
  breakdown(): IPriceLine[]
}

export interface IBuiltBeverages {
  beverages: IBeverage[]
  ingredientMap: Map<string, IIngredient>
  sizeMap: Map<string, ISize>
}
