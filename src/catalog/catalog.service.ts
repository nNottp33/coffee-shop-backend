import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { IngredientEntity } from '@/common/database/entity/ingredient.entity'
import { SizeEntity } from '@/common/database/entity/size.entity'
import { ExceptionService } from '@/common/exception/exception.service'
import { IngredientCategoryEnum } from '@/utils/constants/catalog.enum'
import { messageError } from '@/utils/constants/messageError'
import { toMajor } from '@/utils/functions/money'
import { IIngredient, ISize } from './catalog.interface'
import { GetCatalogResponse, IngredientResult, SizeResult } from './models'

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(IngredientEntity)
    private readonly ingredientRepository: Repository<IngredientEntity>,
    @InjectRepository(SizeEntity)
    private readonly sizeRepository: Repository<SizeEntity>,
    private readonly exceptionService: ExceptionService
  ) {}

  private mapIngredient(entity: IngredientEntity): IIngredient {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      category: entity.category,
      price: entity.price_minor
    }
  }

  private mapSize(entity: SizeEntity): ISize {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      surcharge: entity.surcharge_minor
    }
  }

  private mapIngredientResult(entity: IngredientEntity): IngredientResult {
    return {
      ...this.mapIngredient(entity),
      price: toMajor(entity.price_minor)
    }
  }

  private mapSizeResult(entity: SizeEntity): SizeResult {
    return {
      ...this.mapSize(entity),
      surcharge: toMajor(entity.surcharge_minor)
    }
  }

  async getCatalog(requestId: string): Promise<GetCatalogResponse> {
    try {
      const [ingredientRows, sizeRows] = await Promise.all([
        this.ingredientRepository.find({
          where: { is_active: true },
          order: { sort_order: 'ASC', name: 'ASC' }
        }),
        this.sizeRepository.find({
          where: { is_active: true },
          order: { sort_order: 'ASC' }
        })
      ])
      const getByCategory = (
        category: IngredientCategoryEnum
      ): IngredientResult[] => {
        return ingredientRows
          .filter((row) => row.category === category)
          .map((row) => this.mapIngredientResult(row))
      }
      const result = {
        bases: getByCategory(IngredientCategoryEnum.BASE),
        syrups: getByCategory(IngredientCategoryEnum.SYRUP),
        toppings: getByCategory(IngredientCategoryEnum.TOPPING),
        sizes: sizeRows.map((row) => this.mapSizeResult(row))
      }

      return {
        status: 200,
        code: 'SUCCESSFULLY',
        message: 'get catalog successfully',
        result
      }
    } catch (error) {
      this.exceptionService.throwHttpError({
        error,
        errorType: 'getCatalog',
        requestId
      })
    }
  }

  async findIngredientByIds(ids: string[]): Promise<Map<string, IIngredient>> {
    const unique = [...new Set(ids)]
    if (unique.length === 0) return new Map()

    const rows = await this.ingredientRepository.find({
      where: { id: In(unique), is_active: true }
    })
    const rowMap = new Map(rows.map((row) => [row.id, row]))
    const missing = unique.filter((id) => !rowMap.has(id.toLowerCase()))
    if (missing.length) {
      this.exceptionService.throwHttpError({
        ...messageError.INGREDIENT_NOT_FOUND,
        message: `Unknown ingredient id(s): ${missing.join(', ')}`
      })
    }

    return new Map(
      unique.map((id) => [
        id,
        this.mapIngredient(rowMap.get(id.toLowerCase())!)
      ])
    )
  }

  async findSizeByIds(ids: string[]): Promise<Map<string, ISize>> {
    const unique = [...new Set(ids)]
    if (unique.length === 0) return new Map()

    const rows = await this.sizeRepository.find({
      where: { id: In(unique), is_active: true }
    })
    const rowMap = new Map(rows.map((row) => [row.id, row]))
    const missing = unique.filter((id) => !rowMap.has(id.toLowerCase()))
    if (missing.length) {
      this.exceptionService.throwHttpError({
        ...messageError.SIZE_NOT_FOUND,
        message: `Unknown size id(s): ${missing.join(', ')}`
      })
    }

    return new Map(
      unique.map((id) => [id, this.mapSize(rowMap.get(id.toLowerCase())!)])
    )
  }
}
