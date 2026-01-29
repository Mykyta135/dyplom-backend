import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// Import configurations
import { appConfig, appSchema } from './config/app.config';
import { authConfig, authSchema } from './config/auth.config';
import { databaseConfig, databaseSchema } from './config/database.config';

// Import our new architectural modules
import { CoreModule } from './core/core.module';
import { AuthModule } from './modules/auth/auth.module';
// import { UsersModule } from './modules/users/users.module'; // When you create it

@Module({
  imports: [
    // 1. Global Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig],
      validationSchema: Joi.object({
        ...appSchema,
        ...databaseSchema,
        ...authSchema,
      }),
    }),

    // 2. Database Connection
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
        synchronize: false, // Ensure this is false
        migrations: ['dist/migrations/*{.ts,.js}'],
      }),
    }),

    // 3. Core Application Foundation
    CoreModule,

    // 4. Feature Modules
    AuthModule,
    // UsersModule,
  ],
  controllers: [AppController], // Keep this simple for now
  providers: [AppService],
})
export class AppModule {}
