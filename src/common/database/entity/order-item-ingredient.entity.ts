import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm'
import { TableEnum } from '@/utils/constants/enum'
import { IngredientEntity } from './ingredient.entity'
import { OrderItemEntity } from './order-item.entity'

@Entity({ name: TableEnum.ORDER_ITEM_INGREDIENTS })
export class OrderItemIngredientEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => OrderItemEntity, (item) => item.ingredients, {
    onDelete: 'CASCADE',
    nullable: false
  })
  @JoinColumn({ name: 'order_item_id' })
  order_item!: OrderItemEntity

  @ManyToOne(() => IngredientEntity, {
    nullable: false,
    onDelete: 'RESTRICT'
  })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient!: IngredientEntity

  @Column({
    type: 'integer'
  })
  position!: number

  @Column({
    type: 'varchar',
    length: 128
  })
  name_snapshot!: string

  @Column({
    type: 'integer'
  })
  price_minor_snapshot!: number
}
