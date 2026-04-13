import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: Number.parseInt(process.env.APP_PORT ?? '3000', 10),
  globalPrefix: process.env.APP_GLOBAL_PREFIX ?? 'api',
}));
