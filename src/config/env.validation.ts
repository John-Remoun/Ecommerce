import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  APPLICATION_NAME: Joi.string().default('ecommerce-backend'),
  PORT: Joi.number().default(8000),
  DB_URI: Joi.string().required(),
  ENC_KEY: Joi.string()
    .length(64)
    .pattern(/^[0-9a-fA-F]+$/)
    .required()
    .messages({
      'string.length': 'ENC_KEY must be a 32-character hex string (16 bytes)',
    }),
  ENC_IV_LENGTH: Joi.number().default(16),
  User_TOKEN_SECRET_KEY: Joi.string().min(16).required(),
  System_TOKEN_SECRET_KEY: Joi.string().min(16).required(),
  User_REFRESH_TOKEN_SECRET_KEY: Joi.string().min(16).required(),
  System_REFRESH_TOKEN_SECRET_KEY: Joi.string().min(16).required(),
  ACCESS_EXPIRES_IN: Joi.number().default(1800),
  REFRESH_EXPIRES_IN: Joi.number().default(31536000),
  SALT_ROUND: Joi.number().default(10),
  CLIENT_IDS: Joi.string().optional(),
  REDIS_URI: Joi.string().uri().optional(),
  EMAIL_APP: Joi.string().email().optional(),
  EMAIL_APP_PASSWORD: Joi.string().optional(),
  FACEBOOK_LINK: Joi.string().uri().optional(),
  INSTAGRAM_LINK: Joi.string().uri().optional(),
  TWITTER_LINK: Joi.string().uri().optional(),
  ORIGINS: Joi.string().default('http://localhost:3000'),
  S3_REGION: Joi.string().optional(),
  S3_EXPIRES_IN: Joi.number().default(120),
  S3_BUCKET_NAME: Joi.string().optional(),
  S3_ACCESS_KEY_ID: Joi.string().optional(),
  S3_ACCESS_SECRET_KEY: Joi.string().optional(),
  REQUIRE_EMAIL_VERIFICATION: Joi.boolean().default(false),
  STRIPE_SECRET_KEY: Joi.string().optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional(),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
});
