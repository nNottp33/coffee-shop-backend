import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn
} from 'typeorm'
import { TableEnum } from '@/utils/constants/enum'
import { IngredientEntity } from './ingredient.entity'
import { SizeEntity } from './size.entity'
import { OrderItemIngredientEntity } from './order-item-ingredient.entity'
import { OrderEntity } from './order.entity'

@Entity({ name: TableEnum.ORDER_ITEMS })
export class OrderItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => OrderEntity, (order) => order.items, {
    onDelete: 'CASCADE',
    nullable: false
  })
  @JoinColumn({ name: 'order_id' })
  order!: OrderEntity

  @Column({
    type: 'integer'
  })
  position!: number

  @ManyToOne(() => IngredientEntity, {
    nullable: false,
    onDelete: 'RESTRICT'
  })
  @JoinColumn({ name: 'base_ingredient_id' })
  base!: IngredientEntity

  @ManyToOne(() => SizeEntity, {
    nullable: false,
    onDelete: 'RESTRICT'
  })
  @JoinColumn({ name: 'size_id' })
  size!: SizeEntity

  @Column({
    type: 'varchar',
    length: 128
  })
  base_name_snapshot!: string

  @Column({
    type: 'integer'
  })
  base_price_minor_snapshot!: number

  @Column({
    type: 'varchar',
    length: 64
  })
  size_name_snapshot!: string

  @Column({
    type: 'integer'
  })
  size_surcharge_minor_snapshot!: number

  @Column({
    type: 'text'
  })
  description!: string

  @Column({
    type: 'integer'
  })
  quantity!: number

  @Column({
    type: 'integer'
  })
  unit_price_minor!: number

  @Column({
    type: 'integer'
  })
  line_total_minor!: number

  @OneToMany(
    () => OrderItemIngredientEntity,
    (ingredient) => ingredient.order_item,
    {
      cascade: true,
      eager: true
    }
  )
  ingredients!: OrderItemIngredientEntity[]
}
