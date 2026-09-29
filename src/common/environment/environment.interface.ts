export interface IEnvironment {
  app: IAppEnv
  db: IDatabaseEnv
}

export interface IAppEnv {
  PORT: number
  CORS_ORIGIN: string
}

export interface IDatabaseEnv {
  DB_HOST: string
  DB_PORT: number
  DB_USER: string
  DB_PASSWORD: string
  DB_NAME: string
  DB_LOGGING: boolean
}
