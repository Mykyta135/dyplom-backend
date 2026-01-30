import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { appConfig, appSchema } from './config/app.config';
import { authConfig, authSchema } from './config/auth.config';
import {
  databaseConfig,
  databaseSchema,
  redisConfig,
  redisSchema,
} from './config/database.config';

import { CoreModule } from './core/core.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig, redisConfig],
      validationSchema: Joi.object({
        ...appSchema,
        ...databaseSchema,
        ...authSchema,
        ...redisSchema,
      }),
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [databaseConfig.KEY],
      useFactory: (dbConfig: ConfigType<typeof databaseConfig>) => ({
        type: 'postgres',
        host: dbConfig.host,
        port: dbConfig.port,
        username: dbConfig.username,
        password: dbConfig.password,
        database: dbConfig.name,
        retryAttempts: dbConfig.retryAttempts,
        retryDelay: dbConfig.retryDelay,
        autoLoadEntities: true,
        synchronize: false,
        migrations: ['dist/migrations/*{.ts,.js}'],
      }),
    }),

    CoreModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
