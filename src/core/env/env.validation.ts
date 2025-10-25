import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('dev', 'stg', 'prod').default('dev'),
  PORT: Joi.number().default(3333),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('30d'),

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

  RATE_LIMIT: Joi.number().required(),
  RATE_LIMIT_TTL: Joi.number().required(),
});
