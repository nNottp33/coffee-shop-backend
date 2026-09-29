import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from 'typeorm'
import { IngredientCategoryEnum } from '@/utils/constants/catalog.enum'
import { TableEnum } from '@/utils/constants/enum'

@Entity({ name: TableEnum.INGREDIENTS })
export class IngredientEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({
    type: 'varchar',
    length: 64,
    unique: true
  })
  code!: string

  @Column({
    type: 'varchar',
    length: 128
  })
  name!: string

  @Column({
    type: 'enum',
    enum: IngredientCategoryEnum,
    enumName: 'ingredient_category'
  })
  category!: IngredientCategoryEnum

  @Column({
    type: 'integer'
  })
  price_minor!: number

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
