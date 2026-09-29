import { Module } from '@nestjs/common'
import { CommonModule } from '@/common/common.module'
import {
  IngredientTypeOrmModule,
  SizeTypeOrmModule
} from '@/common/database/entity'
import { CatalogController } from './catalog.controller'
import { CatalogService } from './catalog.service'

@Module({
  imports: [CommonModule, IngredientTypeOrmModule, SizeTypeOrmModule],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService]
})
export class CatalogModule {}
