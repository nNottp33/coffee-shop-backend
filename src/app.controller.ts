import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { DataSource } from 'typeorm'

@ApiTags('health')
@Controller('health')
export class AppController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  async getHealth(): Promise<{
    status: string
    db: string
    timestamp: string
  }> {
    await this.dataSource.query('SELECT 1')

    return { status: 'ok', db: 'up', timestamp: new Date().toISOString() }
  }
}
