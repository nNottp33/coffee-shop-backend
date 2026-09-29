import { Logger, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { IAppEnv } from './common/environment/environment.interface'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)
  const { PORT, CORS_ORIGIN } = configService.getOrThrow<IAppEnv>('app')

  app.setGlobalPrefix('api')
  app.enableCors({
    origin: CORS_ORIGIN.split(',').map((origin) => origin.trim())
  })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  )

  const swagger = new DocumentBuilder()
    .setTitle('Customizable Coffee Shop API')
    .setDescription(
      'Build drinks from a base + syrups/toppings + size, and place orders.'
    )
    .setVersion('1.0')
    .build()
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swagger)
  )

  await app.listen(PORT, () =>
    Logger.log(
      `API listening on http://localhost:${PORT}/api (docs at /api/docs)`,
      'Bootstrap'
    )
  )
}

bootstrap()
