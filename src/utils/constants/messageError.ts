import { HttpStatusCode } from './enum'

export const messageError = {
  SOMETHING_WENT_WRONG: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal Server Error',
    status: HttpStatusCode.InternalServerError
  },
  BAD_REQUEST: {
    code: 'BAD_REQUEST',
    message: 'Bad Request',
    status: HttpStatusCode.BadRequest
  },
  LIMIT_INVALID: {
    code: 'LIMIT_INVALID',
    message: 'limit must be a number',
    status: HttpStatusCode.BadRequest
  },
  INGREDIENT_NOT_FOUND: {
    code: 'INGREDIENT_NOT_FOUND',
    message: 'Ingredient not found',
    status: HttpStatusCode.NotFound
  },
  SIZE_NOT_FOUND: {
    code: 'SIZE_NOT_FOUND',
    message: 'Size not found',
    status: HttpStatusCode.NotFound
  },
  ORDER_NOT_FOUND: {
    code: 'ORDER_NOT_FOUND',
    message: 'Order not found',
    status: HttpStatusCode.NotFound
  }
}
