import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { createApp } from './app.factory';

async function bootstrap(): Promise<void> {
  const app = await createApp();
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(`API escuchando en http://localhost:${port}/v1`, 'Bootstrap');
}

void bootstrap();
