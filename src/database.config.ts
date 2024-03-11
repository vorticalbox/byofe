import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  uri: process.env.MONGO_URI,
  maxPoolSize: Number.parseInt(process.env.MONGO_MAX_POOL_SIZE, 10) || 10,
}));
