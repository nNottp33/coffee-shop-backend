import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IngredientCategoryEnum } from '@/utils/constants/catalog.enum'
import { DefaultResponse } from '@/utils/constants/default.model'

export class IngredientResult {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty({ example: 'VANILLA' })
  code!: string

  @ApiProperty({ example: 'Vanilla' })
  name!: string

  @ApiProperty({ enum: IngredientCategoryEnum })
  category!: IngredientCategoryEnum

  @ApiProperty({ example: 10, description: 'Price in THB' })
  price!: number
}

export class SizeResult {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty({ example: 'L' })
  code!: string

  @ApiProperty({ example: 'Large' })
  name!: string

  @ApiProperty({ example: 20, description: 'Surcharge in THB' })
  surcharge!: number
}

export class CatalogResult {
  @ApiProperty({ type: [IngredientResult] })
  bases!: IngredientResult[]

  @ApiProperty({ type: [IngredientResult] })
  syrups!: IngredientResult[]

  @ApiProperty({ type: [IngredientResult] })
  toppings!: IngredientResult[]

  @ApiProperty({ type: [SizeResult] })
  sizes!: SizeResult[]
}

export class GetCatalogResponse extends DefaultResponse {
  @ApiPropertyOptional({ type: CatalogResult })
  result?: CatalogResult
}
