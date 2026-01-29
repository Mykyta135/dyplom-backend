import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { appConfig, appSchema } from './config/app.config';
import { authConfig, authSchema } from './config/auth.config';
import { databaseConfig, databaseSchema } from './config/database.config';

import { CoreModule } from './core/core.module';

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
      useFactory: (dbConfig: ConfigType<typeof databaseConfig>) => ({
        type: 'postgres',
        host: dbConfig.host,
        port: dbConfig.port,
        username: dbConfig.username,
        password: dbConfig.password,
        database: dbConfig.name,
        autoLoadEntities: true,
        synchronize: false,
        migrations: ['dist/migrations/*{.ts,.js}'],
      }),
    }),

    CoreModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
