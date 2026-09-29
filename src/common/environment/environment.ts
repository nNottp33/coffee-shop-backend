import { IEnvironment } from './environment.interface'

const ENV = process.env

export const environment = (): IEnvironment => ({
  app: {
    PORT: Number(ENV.PORT) || 3000,
    CORS_ORIGIN: ENV.CORS_ORIGIN || 'http://localhost:5173'
  },
  db: {
    DB_HOST: ENV.DB_HOST || 'localhost',
    DB_PORT: Number(ENV.DB_PORT) || 5432,
    DB_USER: ENV.DB_USER || 'coffee',
    DB_PASSWORD: ENV.DB_PASSWORD || 'coffee',
    DB_NAME: ENV.DB_NAME || 'coffee_shop',
    DB_LOGGING: ENV.DB_LOGGING === 'true'
  }
})
