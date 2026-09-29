import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { DrinkQuoteResult } from '@/drinks/models'
import { DefaultResponse } from '@/utils/constants/default.model'

export class ReceiptItemResult extends DrinkQuoteResult {
  @ApiProperty({ example: 2 })
  quantity!: number

  @ApiProperty({ example: 210 })
  line_total!: number
}

export class ReceiptResult {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty({ example: 42 })
  order_number!: number

  @ApiPropertyOptional({ example: 'Nattapon', nullable: true })
  customer_name!: string | null

  @ApiProperty({ type: [ReceiptItemResult] })
  items!: ReceiptItemResult[]

  @ApiProperty({ example: 250, description: 'Grand total in THB' })
  grand_total!: number

  @ApiProperty({ example: 'THB' })
  currency!: string

  @ApiProperty()
  created_at!: Date
}

export class CreateOrderResponse extends DefaultResponse {
  @ApiPropertyOptional({ type: ReceiptResult })
  result?: ReceiptResult
}

export class GetOrderResponse extends DefaultResponse {
  @ApiPropertyOptional({ type: ReceiptResult })
  result?: ReceiptResult
}

export class GetOrdersResponse extends DefaultResponse {
  @ApiPropertyOptional({ type: [ReceiptResult] })
  result?: ReceiptResult[]
}
