import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { OrderItemIngredientEntity } from '@/common/database/entity/order-item-ingredient.entity'
import { OrderItemEntity } from '@/common/database/entity/order-item.entity'
import { OrderEntity } from '@/common/database/entity/order.entity'
import { ExceptionService } from '@/common/exception/exception.service'
import { DrinksService } from '@/drinks/drinks.service'
import { CurrencyEnum } from '@/utils/constants/enum'
import { messageError } from '@/utils/constants/messageError'
import { toMajor } from '@/utils/functions/money'
import { CreateOrderInput } from './input'
import {
  CreateOrderResponse,
  GetOrderResponse,
  GetOrdersResponse,
  ReceiptResult
} from './models'
import { Order, OrderLine } from './order'

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly drinksService: DrinksService,
    private readonly exceptionService: ExceptionService
  ) {}

  private mapReceipt(entity: OrderEntity): ReceiptResult {
    const items = [...(entity.items ?? [])].sort(
      (current, next) => current.position - next.position
    )

    return {
      id: entity.id,
      order_number: entity.order_number,
      customer_name: entity.customer_name,
      currency: CurrencyEnum.THB,
      created_at: entity.created_at,
      grand_total: toMajor(entity.grand_total_minor),
      items: items.map((item) => {
        const extras = [...(item.ingredients ?? [])].sort(
          (current, next) => current.position - next.position
        )

        return {
          description: item.description,
          quantity: item.quantity,
          unit_price: toMajor(item.unit_price_minor),
          line_total: toMajor(item.line_total_minor),
          breakdown: [
            {
              label: item.base_name_snapshot,
              amount: toMajor(item.base_price_minor_snapshot)
            },
            ...extras.map((extra) => ({
              label: extra.name_snapshot,
              amount: toMajor(extra.price_minor_snapshot)
            })),
            ...(item.size_surcharge_minor_snapshot > 0
              ? [
                  {
                    label: `Size: ${item.size_name_snapshot}`,
                    amount: toMajor(item.size_surcharge_minor_snapshot)
                  }
                ]
              : [])
          ]
        }
      })
    }
  }

  async createOrder(
    requestId: string,
    input: CreateOrderInput
  ): Promise<CreateOrderResponse> {
    const { customer_name, items } = input
    try {
      const { beverages, ingredientMap, sizeMap } =
        await this.drinksService.buildBeverages(items)
      const order = new Order(
        beverages.map(
          (beverage, index) =>
            new OrderLine(beverage, items[index].quantity ?? 1)
        )
      )

      const saved = await this.dataSource.transaction(async (manager) => {
        const create = manager.create(OrderEntity, {
          customer_name: customer_name?.trim() || null,
          grand_total_minor: order.grandTotal,
          items: order.lines.map((line, position) => {
            const item = items[position]
            const base = ingredientMap.get(item.base_id)!
            const size = sizeMap.get(item.size_id)!

            return manager.create(OrderItemEntity, {
              position,
              base: { id: base.id },
              size: { id: size.id },
              base_name_snapshot: base.name,
              base_price_minor_snapshot: base.price,
              size_name_snapshot: size.name,
              size_surcharge_minor_snapshot: size.surcharge,
              description: line.description,
              quantity: line.quantity,
              unit_price_minor: line.unitPrice,
              line_total_minor: line.lineTotal,
              ingredients: (item.ingredient_ids ?? []).map(
                (ingredientId, index) => {
                  const ingredient = ingredientMap.get(ingredientId)!

                  return manager.create(OrderItemIngredientEntity, {
                    ingredient: { id: ingredient.id },
                    position: index,
                    name_snapshot: ingredient.name,
                    price_minor_snapshot: ingredient.price
                  })
                }
              )
            })
          })
        })

        return manager.save(create)
      })
      const result = {
        id: saved.id,
        order_number: saved.order_number,
        customer_name: saved.customer_name,
        currency: CurrencyEnum.THB,
        created_at: saved.created_at,
        grand_total: toMajor(order.grandTotal),
        items: order.lines.map((line) => ({
          ...this.drinksService.mapDrinkQuote(line.beverage),
          quantity: line.quantity,
          line_total: toMajor(line.lineTotal)
        }))
      }

      return {
        status: 201,
        code: 'SUCCESSFULLY',
        message: `create order number ${saved.order_number} successfully`,
        result
      }
    } catch (error) {
      this.exceptionService.throwHttpError({
        error,
        errorType: 'createOrder',
        requestId,
        requestBody: JSON.stringify({ items })
      })
    }
  }

  async getOrders(requestId: string, limit = 50): Promise<GetOrdersResponse> {
    try {
      const rows = await this.orderRepository.find({
        order: { created_at: 'DESC' },
        take: Math.min(Math.max(limit, 1), 200)
      })

      return {
        status: 200,
        code: 'SUCCESSFULLY',
        message: 'get orders successfully',
        result: rows.map((row) => this.mapReceipt(row))
      }
    } catch (error) {
      this.exceptionService.throwHttpError({
        error,
        errorType: 'getOrders',
        requestId,
        requestBody: JSON.stringify({ limit })
      })
    }
  }

  async getOrderById(requestId: string, id: string): Promise<GetOrderResponse> {
    try {
      const findById = await this.orderRepository.findOne({ where: { id } })
      if (!findById) {
        this.exceptionService.throwHttpError({
          ...messageError.ORDER_NOT_FOUND,
          message: `Order ${id} not found`
        })
      }

      return {
        status: 200,
        code: 'SUCCESSFULLY',
        message: 'get order successfully',
        result: this.mapReceipt(findById)
      }
    } catch (error) {
      this.exceptionService.throwHttpError({
        error,
        errorType: 'getOrderById',
        requestId,
        requestBody: JSON.stringify({ id })
      })
    }
  }
}
