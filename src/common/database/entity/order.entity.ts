import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn
} from 'typeorm'
import { TableEnum } from '@/utils/constants/enum'
import { OrderItemEntity } from './order-item.entity'

@Entity({ name: TableEnum.ORDERS })
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({
    type: 'integer',
    generated: 'increment',
    unique: true
  })
  order_number!: number

  @Column({
    type: 'varchar',
    length: 128,
    nullable: true
  })
  customer_name!: string | null

  @Column({
    type: 'integer'
  })
  grand_total_minor!: number

  @OneToMany(() => OrderItemEntity, (item) => item.order, {
    cascade: true,
    eager: true
  })
  items!: OrderItemEntity[]

  @CreateDateColumn({
    type: 'timestamptz'
  })
  created_at!: Date
}
