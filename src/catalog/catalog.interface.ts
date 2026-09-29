import { IngredientCategoryEnum } from '@/utils/constants/catalog.enum'
import { Minor } from '@/utils/functions/money'

export interface IIngredient {
  readonly id: string
  readonly code: string
  readonly name: string
  readonly category: IngredientCategoryEnum
  readonly price: Minor
}

export interface ISize {
  readonly id: string
  readonly code: string
  readonly name: string
  readonly surcharge: Minor
}
