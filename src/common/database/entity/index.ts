import { TypeOrmModule } from '@nestjs/typeorm'
import { IngredientEntity } from './ingredient.entity'
import { SizeEntity } from './size.entity'
import { OrderEntity } from './order.entity'

export const IngredientTypeOrmModule = TypeOrmModule.forFeature([
  IngredientEntity
])

export const SizeTypeOrmModule = TypeOrmModule.forFeature([SizeEntity])

export const OrderTypeOrmModule = TypeOrmModule.forFeature([OrderEntity])
