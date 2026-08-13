import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ENV } from './config/config.constants';
import type { Env } from './config/env.schema';

export async function startApplication(app: INestApplication): Promise<void> {
  app.enableShutdownHooks();
  await app.listen(app.get<Env>(ENV).PORT);
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await startApplication(app);
}

if (require.main === module) {
  void bootstrap();
}
