import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger'
import { RequestId } from '@/common/decorators'
import { DrinksService } from './drinks.service'
import { DrinkSpecInput } from './input'
import { GetDrinkQuoteResponse } from './models'

@ApiTags('drinks')
@Controller('drinks')
export class DrinksController {
  constructor(private readonly drinksService: DrinksService) {}

  @Post('quote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Describe and price a single customised drink without ordering it'
  })
  @ApiOkResponse({ type: GetDrinkQuoteResponse })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Unknown ingredient or size id' })
  async getDrinkQuote(
    @RequestId() requestId: string,
    @Body() input: DrinkSpecInput
  ): Promise<GetDrinkQuoteResponse> {
    return await this.drinksService.getDrinkQuote(requestId, input)
  }
}
