import 'dotenv/config';
import { Global, Module } from '@nestjs/common';
import { ENV } from './config.constants';
import { parseEnv } from './env.schema';

@Global()
@Module({
  providers: [{ provide: ENV, useFactory: () => parseEnv(process.env) }],
  exports: [ENV],
})
export class ConfigModule {}
