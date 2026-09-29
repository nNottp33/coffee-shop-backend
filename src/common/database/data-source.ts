import 'reflect-metadata'
import { existsSync } from 'fs'
import { DataSource } from 'typeorm'
import { environment } from '@/common/environment/environment'
import { buildDataSourceOptions } from './database.config'

if (existsSync('.env')) {
  process.loadEnvFile()
}

export const AppDataSource = new DataSource(
  buildDataSourceOptions(environment().db)
)
