import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { CatalogModule } from './catalog/catalog.module'
import { CommonModule } from './common/common.module'
import { DrinksModule } from './drinks/drinks.module'
import { OrdersModule } from './orders/orders.module'

@Module({
  imports: [CommonModule, CatalogModule, DrinksModule, OrdersModule],
  controllers: [AppController]
})
export class AppModule {}
