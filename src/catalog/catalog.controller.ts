import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { RequestId } from '@/common/decorators'
import { CatalogService } from './catalog.service'
import { GetCatalogResponse } from './models'

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  @ApiOperation({
    summary: 'List all active bases, syrups, toppings and sizes'
  })
  @ApiOkResponse({ type: GetCatalogResponse })
  async getCatalog(
    @RequestId() requestId: string
  ): Promise<GetCatalogResponse> {
    return await this.catalogService.getCatalog(requestId)
  }
}
