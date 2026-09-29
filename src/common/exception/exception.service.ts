import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { messageError } from '@/utils/constants/messageError'
import { DomainError } from './domain-error.exception'
import { IError, IResponseError } from './error.interface'

@Injectable()
export class ExceptionService {
  private readonly logger = new Logger(ExceptionService.name)

  private mapResponseError(responseError: IError): IResponseError {
    const { error, status, code, message } = responseError
    const { SOMETHING_WENT_WRONG, BAD_REQUEST } = messageError
    if (error instanceof HttpException) {
      const response = error.getResponse() as Partial<IResponseError>

      return {
        status: error.getStatus(),
        message: error.message,
        code: response.code || HttpStatus[error.getStatus()]
      }
    }
    if (error instanceof DomainError) {
      return { ...BAD_REQUEST, message: error.message }
    }
    if (error) return SOMETHING_WENT_WRONG

    return {
      status: status || SOMETHING_WENT_WRONG.status,
      message: message || SOMETHING_WENT_WRONG.message,
      code: code || SOMETHING_WENT_WRONG.code
    }
  }

  throwHttpError(responseError: IError): never {
    const { error, errorType, requestId, requestBody } = responseError
    const { status, message, code } = this.mapResponseError(responseError)

    const log = `${errorType} CATCH: ${status} ${code} requestId=${requestId} requestBody=${requestBody}`

    if (error && status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(log, error instanceof Error ? error.stack : undefined)
    } else if (error) {
      this.logger.warn(log)
    }

    throw new HttpException({ status, message, code }, status)
  }
}
