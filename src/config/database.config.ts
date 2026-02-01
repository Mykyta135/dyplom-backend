import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  name: process.env.DB_DATABASE,
  synchronize: false,
  retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS ?? '5', 10),
  retryDelay: parseInt(process.env.DB_RETRY_DELAY ?? '3000', 10),
  // Advanced Extra Configuration
  extra: {
    // 1. Connection Pool Tuning: Keep enough warm connections but don't bloat
    max: parseInt(process.env.DB_POOL_MAX ?? '30', 10),
    min: parseInt(process.env.DB_POOL_MIN ?? '10', 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT ?? '10000', 10),
    connectionTimeoutMillis: parseInt(
      process.env.DB_CONN_TIMEOUT ?? '5000',
      10,
    ),

    // 2. Performance & Resilience Tuning
    statement_timeout: 10000, // Kill queries taking > 10s
    query_timeout: 10000,
    application_name: 'aegis_api_server',
  },

  // 3. Automated Snake Case Mapping
  // This converts "createdAt" in TS to "created_at" in Postgres automatically
  namingStrategy: new SnakeNamingStrategy(),

  // 4. Observability & Debugging
  logging:
    process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  logger: 'advanced-console',
  maxQueryExecutionTime: 2000, // Highlight queries slower than 2 seconds

  // 5. SSL (Crucial for Production/Cloud DBs)
  ssl:
    process.env.DB_SSL === 'true'
      ? {
          rejectUnauthorized:
            process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
          ca: process.env.DB_SSL_CA ?? undefined,
        }
      : false,
}));

export const databaseSchema = {
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  DB_RETRY_ATTEMPTS: Joi.number().default(5),
  DB_RETRY_DELAY: Joi.number().default(3000),
  DB_SSL: Joi.string().valid('true', 'false').default('false'),
  DB_POOL_MAX: Joi.number().default(30),
  DB_POOL_MIN: Joi.number().default(10),
  DB_IDLE_TIMEOUT: Joi.number().default(10000),
  DB_CONN_TIMEOUT: Joi.number().default(5000),
};

export const redisSchema = {
  REDIS_HOST: Joi.string().default('redis'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_RETRY_ATTEMPTS: Joi.number().default(10),
  REDIS_RETRY_DELAY: Joi.number().default(3000),
};

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  retryAttempts: parseInt(process.env.REDIS_RETRY_ATTEMPTS ?? '10', 10),
  retryDelay: parseInt(process.env.REDIS_RETRY_DELAY ?? '3000', 10),
}));
