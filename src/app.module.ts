import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { appConfig, appSchema } from './config/app.config';
import { authConfig, authSchema } from './config/auth.config';
import { databaseConfig, databaseSchema } from './config/database.config';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig],

      validationSchema: Joi.object({
        ...appSchema,
        ...databaseSchema,
        ...authSchema,
      }),
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [databaseConfig.KEY],
      useFactory: (databaseConfig_: ConfigType<typeof databaseConfig>) => ({
        type: 'postgres',
        host: databaseConfig_.host,
        port: databaseConfig_.port,
        username: databaseConfig_.username,
        password: databaseConfig_.password,
        database: databaseConfig_.name,
        autoLoadEntities: true,
        synchronize: databaseConfig_.synchronize,
      }),
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
