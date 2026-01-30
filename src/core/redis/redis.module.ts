import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { redisConfig } from 'src/config/database.config';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'REDIS_SERVICE',
        imports: [ConfigModule.forFeature(redisConfig)],
        inject: [redisConfig.KEY],
        useFactory: (config: ConfigType<typeof redisConfig>) => ({
          transport: Transport.REDIS,
          options: {
            host: config.host,
            port: config.port,
            retryAttempts: 10,
            retryDelay: 3000,
          },
        }),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class RedisModule {}
