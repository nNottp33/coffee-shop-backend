import { HttpException, Logger, NotFoundException } from '@nestjs/common'
import { messageError } from '@/utils/constants/messageError'
import { DomainError } from './domain-error.exception'
import { IError } from './error.interface'
import { ExceptionService } from './exception.service'

describe('ExceptionService', () => {
  const service = new ExceptionService()
  const catchError = (responseError: IError): HttpException => {
    try {
      return service.throwHttpError(responseError)
    } catch (error) {
      return error as HttpException
    }
  }

  beforeAll(() => {
    Logger.overrideLogger(false)
  })

  it('throws a messageError entry with its status, code and message', () => {
    const thrown = catchError({
      ...messageError.ORDER_NOT_FOUND,
      message: 'Order 42 not found'
    })

    expect(thrown.getStatus()).toBe(404)
    expect(thrown.getResponse()).toEqual({
      status: 404,
      message: 'Order 42 not found',
      code: 'ORDER_NOT_FOUND'
    })
  })

  it('keeps the status, code and message of an error it threw before', () => {
    const first = catchError(messageError.SIZE_NOT_FOUND)

    const thrown = catchError({ error: first, errorType: 'getDrinkQuote' })

    expect(thrown.getResponse()).toEqual({
      status: 404,
      message: 'Size not found',
      code: 'SIZE_NOT_FOUND'
    })
  })

  it('names the code after the status for other http exceptions', () => {
    const thrown = catchError({ error: new NotFoundException('gone') })

    expect(thrown.getResponse()).toEqual({
      status: 404,
      message: 'gone',
      code: 'NOT_FOUND'
    })
  })

  it('turns a domain error into 400 with its own message', () => {
    const thrown = catchError({
      error: new DomainError('A drink needs a base')
    })

    expect(thrown.getResponse()).toEqual({
      status: 400,
      message: 'A drink needs a base',
      code: 'BAD_REQUEST'
    })
  })

  it('hides the message of an unexpected error behind a 500', () => {
    const thrown = catchError({
      error: new Error('connection to database lost')
    })

    expect(thrown.getResponse()).toEqual({
      status: 500,
      message: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR'
    })
  })
})
