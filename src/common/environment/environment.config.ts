import { ConfigModule } from '@nestjs/config'
import { environment } from './environment'

export const EnvironmentConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  cache: true,
  load: [environment]
})
