export interface IResponseError {
  status: number
  message: string
  code: string
}

export interface IError {
  status?: number
  message?: string
  code?: string
  error?: unknown
  requestId?: string
  errorType?: string
  requestBody?: string
}
