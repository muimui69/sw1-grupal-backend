

export const envConfig = () => ({
  enviroment : process.env.NODE_ENV || 'dev',
  port: +process.env.PORT || 3000,
  database_url: process.env.DATABASE_URL,
  secret_key_jwt: process.env.SECRET_KEY_JWT,
  stripe_key_api: process.env.STRIPE_KEY_API,
  stripe_sucess_url: process.env.STRIPE_SUCESS_URL,
  stripe_cancel_url: process.env.STRIPE_CANCEL_URL
})