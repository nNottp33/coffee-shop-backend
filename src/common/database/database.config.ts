import { DataSourceOptions } from 'typeorm'
import { IDatabaseEnv } from '@/common/environment/environment.interface'
import { IngredientEntity } from './entity/ingredient.entity'
import { SizeEntity } from './entity/size.entity'
import { OrderItemIngredientEntity } from './entity/order-item-ingredient.entity'
import { OrderItemEntity } from './entity/order-item.entity'
import { OrderEntity } from './entity/order.entity'

export const buildDataSourceOptions = (
  databaseEnv: IDatabaseEnv
): DataSourceOptions => {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_LOGGING } =
    databaseEnv

  return {
    type: 'postgres',
    host: DB_HOST,
    port: DB_PORT,
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    entities: [
      IngredientEntity,
      SizeEntity,
      OrderEntity,
      OrderItemEntity,
      OrderItemIngredientEntity
    ],
    migrations: [`${__dirname}/migrations/*.{ts,js}`],
    migrationsTableName: 'migrations',
    synchronize: false,
    logging: DB_LOGGING
  }
}
