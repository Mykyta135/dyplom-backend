import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';

import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
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

import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import * as path from 'path';
import { AuditModule } from './audit/audit.module';
import { CoreModule, HttpCoreModule } from './core/core.module';
import { HealthModule } from './health/health.module';

const isWorker = process.env.APP_MODE === 'WORKER';

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

    ...(isWorker ? [] : [HttpCoreModule]),

    HealthModule,
    AuditModule,

    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'), // This is correct
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [redisConfig.KEY],
      useFactory: async (config: ConfigType<typeof redisConfig>) => ({
        store: await redisStore({
          socket: { host: config.host, port: config.port },
          ttl: 600,
        }),
      }),
    }),

    ...(isWorker ? [] : [PrometheusModule.register({ path: '/metrics' })]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
