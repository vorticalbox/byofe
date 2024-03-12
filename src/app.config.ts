import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  appName: process.env.APP_NAME || 'BYOFE',
  environment: process.env.NODE_ENV || 'development', // 'production' / 'development'
  host: process.env.HOST || 'localhost',
  logLevel: process.env.LOG_LEVEL || 'debug', // 'verbose' / 'debug' / 'log' / 'warn' / 'error' / 'silent'
  port: Number.parseInt(process.env.PORT, 10) || 8080,
  protocol: process.env.HTTP_PROTOCOL || 'http',
  saltRounds: Number.parseInt(process.env.SALT_ROUNDS, 10) || 15,
}));
