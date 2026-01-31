import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const appMode = process.env.APP_MODE ?? 'API';

  if (appMode === 'WORKER') {
    logger.log(`👷 Starting application in WORKER mode...`);

    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
      AppModule,
      {
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: Number(process.env.REDIS_PORT ?? 6379),
        },
      },
    );

    await app.listen();
    logger.log(`👷 Audit Worker is active and listening on Redis events.`);
  } else {
    logger.log(`🚀 Starting application in API mode...`);
    const app = await NestFactory.create(AppModule);

    app.use(helmet());
    app.use(compression());

    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );

    app.enableCors({
      origin: process.env.CORS_ORIGIN?.split(',') ?? 'http://localhost:3000',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidUnknownValues: true,
        transform: true,
      }),
    );

    const config = new DocumentBuilder()
      .setTitle('Aegis Platform API')
      .setDescription(
        'API documentation for the Aegis humanitarian coordination platform',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('aegis')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
      },
    });

    const port = process.env.PORT ?? '3000';
    await app.listen(port);

    logger.log(`🚀 HTTP API is running on: http://localhost:${port}`);
    logger.log(`📖 Swagger documentation at: http://localhost:${port}/api`);
  }
}
void bootstrap();
