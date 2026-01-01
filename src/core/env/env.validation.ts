import { Environment } from '@/common/enums';
import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid(Environment.DEV, Environment.STG, Environment.PROD)
    .default(Environment.DEV),
  PORT: Joi.number().default(3000),
  CLIENT_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('30d'),

  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DATABASE_URL: Joi.string().required(),

  REDIS_URL: Joi.string().required(),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),
  REDIS_PASSWORD: Joi.string().allow('', null),
  REDIS_TLS: Joi.boolean().default(false),

  AWS_S3_BUCKET_NAME: Joi.string().required(),
  AWS_REGION: Joi.string().required(),
  AWS_ACCESS_KEY_ID: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),

  OPENAI_API_KEY: Joi.string().required(),
  OPENAI_MODEL: Joi.string().required(),
  OPENAI_MODEL_SYSTEM_INSTRUCTIONS: Joi.string().required(),

  OPENAI_SEARCH_QUERY_OPTIMIZER_MODEL: Joi.string().required(),
  OPENAI_SEARCH_QUERY_OPTIMIZER_INSTRUCTIONS: Joi.string().required(),
  OPENAI_SEARCH_QUERY_OPTIMIZER_TEMP: Joi.number().required(),

  OPENAI_SEMANTIC_SEARCH_RE_RANKING_MODEL: Joi.string().required(),
  OPENAI_SEMANTIC_SEARCH_RE_RANKING_INSTRUCTIONS: Joi.string().required(),
  OPENAI_SEMANTIC_SEARCH_RE_RANKING_PROMPT: Joi.string().required(),
  OPENAI_SEMANTIC_SEARCH_RE_RANKING_TEMP: Joi.number().required(),

  RATE_LIMIT: Joi.number().required(),
  RATE_LIMIT_TTL: Joi.number().required(),

  ELASTIC_SEARCH_NODE: Joi.string().required(),

  GF_DASHBOARDS_MIN_REFRESH_INTERVAL: Joi.string().required(),

  POLAR_ACCESS_TOKEN_SANDBOX: Joi.string().required(),
  POLAR_WEBHOOK_SECRET_SANDBOX: Joi.string().required(),
  POLAR_ACCESS_TOKEN_PROD: Joi.string().required(),
  POLAR_WEBHOOK_SECRET_PROD: Joi.string().required(),
});
