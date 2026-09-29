import { Injectable } from '@nestjs/common'
import { CatalogService } from '@/catalog/catalog.service'
import { ExceptionService } from '@/common/exception/exception.service'
import { toMajor } from '@/utils/functions/money'
import { DrinkBuilder } from './beverage'
import { IBeverage, IBuiltBeverages } from './drinks.interface'
import { DrinkSpecInput } from './input'
import { DrinkQuoteResult, GetDrinkQuoteResponse } from './models'

@Injectable()
export class DrinksService {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly exceptionService: ExceptionService
  ) {}

  mapDrinkQuote(beverage: IBeverage): DrinkQuoteResult {
    return {
      description: beverage.describe(),
      unit_price: toMajor(beverage.cost()),
      breakdown: beverage.breakdown().map((line) => ({
        label: line.label,
        amount: toMajor(line.amount)
      }))
    }
  }

  async buildBeverages(inputs: DrinkSpecInput[]): Promise<IBuiltBeverages> {
    const ingredientIds = inputs.flatMap((input) => [
      input.base_id,
      ...(input.ingredient_ids ?? [])
    ])
    const [ingredientMap, sizeMap] = await Promise.all([
      this.catalogService.findIngredientByIds(ingredientIds),
      this.catalogService.findSizeByIds(inputs.map((input) => input.size_id))
    ])
    const beverages = inputs.map((input) =>
      DrinkBuilder.create()
        .withBase(ingredientMap.get(input.base_id)!)
        .addAll(
          (input.ingredient_ids ?? []).map((ingredientId) =>
            ingredientMap.get(ingredientId)!
          )
        )
        .withSize(sizeMap.get(input.size_id)!)
        .build()
    )

    return { beverages, ingredientMap, sizeMap }
  }

  async getDrinkQuote(
    requestId: string,
    input: DrinkSpecInput
  ): Promise<GetDrinkQuoteResponse> {
    try {
      const { beverages } = await this.buildBeverages([input])

      return {
        status: 200,
        code: 'SUCCESSFULLY',
        message: 'get drink quote successfully',
        result: this.mapDrinkQuote(beverages[0])
      }
    } catch (error) {
      this.exceptionService.throwHttpError({
        error,
        errorType: 'getDrinkQuote',
        requestId,
        requestBody: JSON.stringify(input)
      })
    }
  }
}
