import { Module } from '@nestjs/common'
import { CommonModule } from '@/common/common.module'
import { OrderTypeOrmModule } from '@/common/database/entity'
import { DrinksModule } from '@/drinks/drinks.module'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'

@Module({
  imports: [CommonModule, DrinksModule, OrderTypeOrmModule],
  controllers: [OrdersController],
  providers: [OrdersService]
})
export class OrdersModule {}
