import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { DefaultResponse } from '@/utils/constants/default.model'

export class PriceLineResult {
  @ApiProperty({ example: 'Vanilla' })
  label!: string

  @ApiProperty({ example: 10 })
  amount!: number
}

export class DrinkQuoteResult {
  @ApiProperty({ example: 'Large Coffee, Vanilla, Vanilla, Whipped Cream' })
  description!: string

  @ApiProperty({ example: 105, description: 'Unit price in THB' })
  unit_price!: number

  @ApiProperty({ type: [PriceLineResult] })
  breakdown!: PriceLineResult[]
}

export class GetDrinkQuoteResponse extends DefaultResponse {
  @ApiPropertyOptional({ type: DrinkQuoteResult })
  result?: DrinkQuoteResult
}
