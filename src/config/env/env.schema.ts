import * as Joi from 'joi';

export const envSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  PORT: Joi.number().default(3000),
  SECRET_KEY_JWT: Joi.string().required(),
  STRIPE_KEY_API: Joi.string().required(),
  STRIPE_SUCESS_URL: Joi.string().required(),
  STRIPE_CANCEL_URL: Joi.string().required(),
  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),
  BLOCKCHAIN_URL: Joi.string().required(),
})