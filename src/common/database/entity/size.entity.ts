import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from 'typeorm'
import { TableEnum } from '@/utils/constants/enum'

@Entity({ name: TableEnum.SIZES })
export class SizeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({
    type: 'varchar',
    length: 32,
    unique: true
  })
  code!: string

  @Column({
    type: 'varchar',
    length: 64
  })
  name!: string

  @Column({
    type: 'integer',
    default: 0
  })
  surcharge_minor!: number

  @Column({
    type: 'boolean',
    default: true
  })
  is_active!: boolean

  @Column({
    type: 'integer',
    default: 0
  })
  sort_order!: number

  @CreateDateColumn({
    type: 'timestamptz'
  })
  created_at!: Date
}
