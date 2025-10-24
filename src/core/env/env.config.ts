import { ConfigFactoryKeyHost, registerAs } from '@nestjs/config';
import { envValidationSchema } from './env.validation';

export const envConfig = registerAs('env', () => {
  const { error, value } = envValidationSchema.validate(process.env, {
    allowUnknown: true,
    stripUnknown: true,
    abortEarly: false,
  });

  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  return value as ConfigFactoryKeyHost;
});
