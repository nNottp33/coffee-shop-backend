import { Module } from '@nestjs/common'
import { DatabaseModule } from './database/database.module'
import { EnvironmentConfigModule } from './environment/environment.config'
import { ExceptionModule } from './exception/exception.module'

@Module({
  imports: [EnvironmentConfigModule, DatabaseModule, ExceptionModule],
  exports: [ExceptionModule]
})
export class CommonModule {}
