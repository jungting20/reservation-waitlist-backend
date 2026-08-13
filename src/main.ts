import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ENV } from './config/config.constants';
import type { Env } from './config/env.schema';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await app.listen(app.get<Env>(ENV).PORT);
}

void bootstrap();
