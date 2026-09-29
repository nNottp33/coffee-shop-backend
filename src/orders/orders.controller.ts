import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger'
import { RequestId } from '@/common/decorators'
import { ExceptionService } from '@/common/exception/exception.service'
import { messageError } from '@/utils/constants/messageError'
import { CreateOrderInput } from './input'
import {
  CreateOrderResponse,
  GetOrderResponse,
  GetOrdersResponse
} from './models'
import { OrdersService } from './orders.service'

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly exceptionService: ExceptionService
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Place an order of one or more drinks and get an itemised receipt'
  })
  @ApiCreatedResponse({ type: CreateOrderResponse })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Unknown ingredient or size id' })
  async createOrder(
    @RequestId() requestId: string,
    @Body() input: CreateOrderInput
  ): Promise<CreateOrderResponse> {
    return await this.ordersService.createOrder(requestId, input)
  }

  @Get()
  @ApiOperation({ summary: 'List recent orders (newest first)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: GetOrdersResponse })
  @ApiBadRequestResponse({ description: 'limit is not a number' })
  async getOrders(
    @RequestId() requestId: string,
    @Query('limit') limit?: string
  ): Promise<GetOrdersResponse> {
    const value = limit?.trim()
    const parsedLimit = value ? Math.trunc(Number(value)) : undefined
    if (Number.isNaN(parsedLimit)) {
      this.exceptionService.throwHttpError(messageError.LIMIT_INVALID)
    }

    return await this.ordersService.getOrders(requestId, parsedLimit)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one receipt' })
  @ApiOkResponse({ type: GetOrderResponse })
  @ApiNotFoundResponse()
  async getOrderById(
    @RequestId() requestId: string,
    @Param('id', new ParseUUIDPipe()) id: string
  ): Promise<GetOrderResponse> {
    return await this.ordersService.getOrderById(requestId, id)
  }
}
