import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { parseEnv } from './src/config/env.schema';

const env = parseEnv(process.env);

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema/index.ts',
  out: './drizzle',
  dbCredentials: { url: env.DATABASE_URL },
});
