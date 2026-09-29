import { ApiProperty } from '@nestjs/swagger'

export class DefaultResponse {
  @ApiProperty({ example: 'SUCCESSFULLY' })
  code!: string

  @ApiProperty({ example: 'successfully' })
  message!: string

  @ApiProperty({ example: 200 })
  status!: number
}
