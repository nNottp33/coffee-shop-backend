import { ISize } from '@/catalog/catalog.interface'
import { IBeverage, IPriceLine } from '@/drinks/drinks.interface'
import { Minor } from '@/utils/functions/money'

export class SizeDecorator implements IBeverage {
  constructor(
    private readonly inner: IBeverage,
    private readonly size: ISize
  ) {}

  describe(): string {
    return `${this.size.name} ${this.inner.describe()}`
  }

  cost(): Minor {
    return this.inner.cost() + this.size.surcharge
  }

  breakdown(): IPriceLine[] {
    const lines = this.inner.breakdown()
    if (this.size.surcharge === 0) return lines

    return [
      ...lines,
      { label: `Size: ${this.size.name}`, amount: this.size.surcharge }
    ]
  }
}
