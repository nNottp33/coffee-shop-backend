import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Request } from 'express'

export const RequestId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<Request>().headers['x-api-request-id']
)
