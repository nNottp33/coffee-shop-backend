import { Module } from '@nestjs/common'
import { CatalogModule } from '@/catalog/catalog.module'
import { CommonModule } from '@/common/common.module'
import { DrinksController } from './drinks.controller'
import { DrinksService } from './drinks.service'

@Module({
  imports: [CommonModule, CatalogModule],
  controllers: [DrinksController],
  providers: [DrinksService],
  exports: [DrinksService]
})
export class DrinksModule {}
