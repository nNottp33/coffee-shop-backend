import { DomainError } from '@/common/exception/domain-error.exception'
import { IBeverage } from '@/drinks/drinks.interface'
import { Minor } from '@/utils/functions/money'

export class OrderLine {
  constructor(
    public readonly beverage: IBeverage,
    public readonly quantity: number = 1
  ) {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new DomainError('Quantity must be a positive integer')
    }
  }

  get description(): string {
    return this.beverage.describe()
  }

  get unitPrice(): Minor {
    return this.beverage.cost()
  }

  get lineTotal(): Minor {
    return this.unitPrice * this.quantity
  }
}

export class Order {
  constructor(public readonly lines: readonly OrderLine[]) {
    if (lines.length === 0) {
      throw new DomainError('An order needs at least one drink')
    }
  }

  get grandTotal(): Minor {
    return this.lines.reduce((sum, line) => sum + line.lineTotal, 0)
  }
}
