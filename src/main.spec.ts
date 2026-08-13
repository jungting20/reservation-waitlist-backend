import type { INestApplication } from '@nestjs/common';
import { startApplication } from './main';

describe('startApplication', () => {
  it('enables shutdown hooks before listening', async () => {
    const calls: string[] = [];
    const listen = jest.fn().mockImplementation(() => {
      calls.push('listen');
      return Promise.resolve();
    });
    const app = {
      enableShutdownHooks: jest.fn(() => {
        calls.push('enableShutdownHooks');
      }),
      get: jest.fn().mockReturnValue({ PORT: 3_000 }),
      listen,
    } as unknown as INestApplication;

    await startApplication(app);

    expect(calls).toEqual(['enableShutdownHooks', 'listen']);
    expect(listen).toHaveBeenCalledWith(3_000);
  });
});
