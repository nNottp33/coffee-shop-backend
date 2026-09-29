import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min
} from 'class-validator'

export class DrinkSpecInput {
  @ApiProperty({
    format: 'uuid',
    description: 'Id of a base ingredient (Coffee, Tea, Milk)'
  })
  @IsUUID()
  base_id!: string

  @ApiProperty({ format: 'uuid', description: 'Id of the cup size' })
  @IsUUID()
  size_id!: string

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'Syrup / topping ids in the order they should appear. Repeat an id for a double.',
    example: []
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('all', { each: true })
  ingredient_ids: string[] = []

  @ApiPropertyOptional({ default: 1, minimum: 1, maximum: 99 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number = 1
}
