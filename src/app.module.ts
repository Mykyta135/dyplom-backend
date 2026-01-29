import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { appConfig, appSchema } from './config/app.config';
import { authConfig, authSchema } from './config/auth.config';
import { databaseConfig, databaseSchema } from './config/database.config';

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
        type: "postgres",
        host: databaseConfig_.host,
        port: databaseConfig_.port,
        username: databaseConfig_.username,
        password: databaseConfig_.password,
        database: databaseConfig_.name,
        autoLoadEntities: true,
        synchronize: databaseConfig_.synchronize,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
