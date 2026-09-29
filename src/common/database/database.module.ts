import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'
import { IDatabaseEnv } from '@/common/environment/environment.interface'
import { buildDataSourceOptions } from './database.config'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async (
        configService: ConfigService
      ): Promise<TypeOrmModuleOptions> => {
        const databaseEnv = configService.getOrThrow<IDatabaseEnv>('db')

        return {
          ...buildDataSourceOptions(databaseEnv),
          autoLoadEntities: true
        }
      },
      inject: [ConfigService]
    })
  ]
})
export class DatabaseModule {}
