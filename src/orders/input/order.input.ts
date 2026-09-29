import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested
} from 'class-validator'
import { DrinkSpecInput } from '@/drinks/input'

export class CreateOrderInput {
  @ApiPropertyOptional({ example: 'Nattapon', maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  customer_name?: string

  @ApiProperty({ type: [DrinkSpecInput], description: 'One or more drinks' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => DrinkSpecInput)
  items!: DrinkSpecInput[]
}
