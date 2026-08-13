import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { Env } from '../src/config/env.schema';
import { assertLocalResetAllowed } from './reset-local-databases';

describe('assertLocalResetAllowed', () => {
  const validEnv: Env = {
    NODE_ENV: 'development',
    PORT: 3000,
    DATABASE_URL:
      'postgresql://reservation:reservation@localhost:5432/reservation',
  };

  it('rejects production environments', () => {
    expect(() => {
      assertLocalResetAllowed({ ...validEnv, NODE_ENV: 'production' });
    }).toThrow();
  });

  it('rejects non-local database hosts', () => {
    expect(() => {
      assertLocalResetAllowed({
        ...validEnv,
        DATABASE_URL: 'postgresql://u:p@db.example.com:5432/reservation',
      });
    }).toThrow();
  });

  it('rejects database names outside the local allowlist', () => {
    expect(() => {
      assertLocalResetAllowed({
        ...validEnv,
        DATABASE_URL: 'postgresql://u:p@localhost:5432/production',
      });
    }).toThrow();
  });

  it('allows a local reservation database in a non-production environment', () => {
    expect(() => {
      assertLocalResetAllowed(validEnv);
    }).not.toThrow();
  });

  it('pins the compose file and project name for destructive commands', () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), 'db-reset-'));
    const callsFile = join(temporaryDirectory, 'docker-calls');
    const fakeDocker = join(temporaryDirectory, 'docker');
    const composeFile = resolve(__dirname, '..', 'compose.yaml');

    writeFileSync(
      fakeDocker,
      '#!/bin/sh\nprintf \'%s\\n\' "$*" >> "$RESET_CALLS_FILE"\n',
      { mode: 0o755 },
    );

    try {
      const result = spawnSync(
        resolve(__dirname, '..', 'node_modules', '.bin', 'tsx'),
        [resolve(__dirname, 'reset-local-databases.ts')],
        {
          cwd: temporaryDirectory,
          encoding: 'utf8',
          env: {
            ...process.env,
            COMPOSE_FILE: '/tmp/unrelated-compose.yaml',
            COMPOSE_PROJECT_NAME: 'unrelated-project',
            DATABASE_URL: validEnv.DATABASE_URL,
            NODE_ENV: validEnv.NODE_ENV,
            PATH: `${temporaryDirectory}:${process.env.PATH ?? ''}`,
            RESET_CALLS_FILE: callsFile,
          },
        },
      );

      expect({ status: result.status, stderr: result.stderr }).toEqual({
        status: 0,
        stderr: '',
      });
      expect(readFileSync(callsFile, 'utf8')).toBe(
        [
          `compose --file ${composeFile} --project-name reservation-waitlist-local down --volumes`,
          `compose --file ${composeFile} --project-name reservation-waitlist-local up --detach --wait`,
          '',
        ].join('\n'),
      );
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  });
});
