import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  name: process.env.DB_DATABASE,
  synchronize: false,
  retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS ?? '5', 10),
  retryDelay: parseInt(process.env.DB_RETRY_DELAY ?? '3000', 10),
}));

export const databaseSchema = {
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  DB_RETRY_ATTEMPTS: Joi.number().default(5),
  DB_RETRY_DELAY: Joi.number().default(3000),
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
