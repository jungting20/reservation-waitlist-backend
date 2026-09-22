import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { ENV } from './config/config.constants';
import type { Env } from './config/env.schema';

describe('AppModule', () => {
  it('compiles', async () => {
    const testEnv: Env = {
      NODE_ENV: 'test',
      PORT: 3000,
      DATABASE_URL:
        'postgresql://reservation:reservation@localhost:5432/reservation_test',
      JWT_SECRET: 'super_secret_jwt_key_at_least_32_characters_long',
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ENV)
      .useValue(testEnv)
      .compile();

    expect(moduleRef).toBeDefined();
    await moduleRef.close();
  });
});
