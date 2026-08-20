import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { Env } from '../src/config/env.schema';
import { assertLocalResetAllowed } from './reset-local-databases';

const projectRoot = resolve(__dirname, '..');
const resetScript = resolve(__dirname, 'reset-local-databases.ts');
const tsx = resolve(projectRoot, 'node_modules', '.bin', 'tsx');
const localDatabaseUrl =
  'postgresql://reservation:reservation@localhost:5432/reservation';

interface ResetInvocationOptions {
  composeFile?: string;
  composeProjectName?: string;
  contextEndpoint?: string;
  contextName?: string;
  databaseUrl?: string | null;
  dockerContext?: string;
  dockerHost?: string;
  dotenv?: string;
  nodeEnv?: string | null;
  pgPort?: string;
}

interface ResetInvocationResult {
  calls: string[][];
  status: number | null;
  stderr: string;
  stdout: string;
}

function readDockerCalls(callsFile: string): string[][] {
  if (!existsSync(callsFile)) {
    return [];
  }

  const calls: string[][] = [];
  let currentCall: string[] | undefined;

  for (const line of readFileSync(callsFile, 'utf8').split('\n')) {
    if (line === 'CALL') {
      currentCall = [];
      calls.push(currentCall);
    } else if (line.startsWith('ARG:') && currentCall) {
      currentCall.push(line.slice(4));
    }
  }

  return calls;
}

function runReset(options: ResetInvocationOptions = {}): ResetInvocationResult {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'db-reset-'));
  const callsFile = join(temporaryDirectory, 'docker-calls');
  const fakeDocker = join(temporaryDirectory, 'docker');
  const excludedEnvironmentNames = new Set([
    'COMPOSE_FILE',
    'COMPOSE_PROJECT_NAME',
    'DATABASE_URL',
    'DOCKER_CONTEXT',
    'DOCKER_HOST',
    'DOTENV_CONFIG_PATH',
    'NODE_ENV',
    'PGPORT',
  ]);
  const environment: NodeJS.ProcessEnv = Object.fromEntries(
    Object.entries(process.env).filter(
      ([name]) => !excludedEnvironmentNames.has(name),
    ),
  );

  writeFileSync(
    fakeDocker,
    [
      '#!/bin/sh',
      '{',
      "  printf '%s\\n' 'CALL'",
      '  for argument in "$@"; do',
      '    printf \'ARG:%s\\n\' "$argument"',
      '  done',
      '} >> "$RESET_CALLS_FILE"',
      'if [ "$1" = "context" ] && [ "$2" = "show" ]; then',
      '  printf \'%s\\n\' "$RESET_CONTEXT_NAME"',
      'elif [ "$1" = "context" ] && [ "$2" = "inspect" ]; then',
      '  printf \'%s\\n\' "$RESET_CONTEXT_ENDPOINT"',
      'fi',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );

  environment.PATH = `${temporaryDirectory}:${process.env.PATH ?? ''}`;
  environment.RESET_CALLS_FILE = callsFile;
  environment.RESET_CONTEXT_ENDPOINT =
    options.contextEndpoint ?? 'unix:///var/run/docker.sock';
  environment.RESET_CONTEXT_NAME = options.contextName ?? 'desktop-linux';

  const databaseUrl = options.databaseUrl ?? localDatabaseUrl;
  const nodeEnv = options.nodeEnv ?? 'development';

  if (options.databaseUrl !== null) {
    environment.DATABASE_URL = databaseUrl;
  }
  if (options.nodeEnv !== null) {
    environment.NODE_ENV = nodeEnv;
  }
  if (options.dockerContext !== undefined) {
    environment.DOCKER_CONTEXT = options.dockerContext;
  }
  if (options.dockerHost !== undefined) {
    environment.DOCKER_HOST = options.dockerHost;
  }
  if (options.composeFile !== undefined) {
    environment.COMPOSE_FILE = options.composeFile;
  }
  if (options.composeProjectName !== undefined) {
    environment.COMPOSE_PROJECT_NAME = options.composeProjectName;
  }
  if (options.pgPort !== undefined) {
    environment.PGPORT = options.pgPort;
  }
  if (options.dotenv !== undefined) {
    writeFileSync(join(temporaryDirectory, '.env'), options.dotenv);
  }

  try {
    const result = spawnSync(tsx, [resetScript], {
      cwd: temporaryDirectory,
      encoding: 'utf8',
      env: environment,
    });

    return {
      calls: readDockerCalls(callsFile),
      status: result.status,
      stderr: result.stderr,
      stdout: result.stdout,
    };
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

function expectNoDestructiveCalls(calls: string[][]): void {
  expect(
    calls.some((call) => call.includes('down') || call.includes('--volumes')),
  ).toBe(false);
}

describe('assertLocalResetAllowed', () => {
  const validEnv: Env = {
    NODE_ENV: 'development',
    PORT: 3000,
    DATABASE_URL: localDatabaseUrl,
    JWT_SECRET: 'test_jwt_secret_min_32_characters_long',
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

  it('rejects database ports other than the effective PostgreSQL default', () => {
    expect(() => {
      assertLocalResetAllowed({
        ...validEnv,
        DATABASE_URL:
          'postgresql://reservation:reservation@localhost:6543/reservation',
      });
    }).toThrow();
  });

  it('allows an omitted port because its effective PostgreSQL port is 5432', () => {
    expect(() => {
      assertLocalResetAllowed({
        ...validEnv,
        DATABASE_URL:
          'postgresql://reservation:reservation@localhost/reservation',
      });
    }).not.toThrow();
  });

  it('allows a local reservation database in a non-production environment', () => {
    expect(() => {
      assertLocalResetAllowed(validEnv);
    }).not.toThrow();
  });
});

describe('database reset command safety', () => {
  it('refuses a wrong database port before invoking Docker', () => {
    const result = runReset({
      databaseUrl:
        'postgresql://reservation:reservation@localhost:6543/reservation',
    });

    expect(result.status).not.toBe(0);
    expectNoDestructiveCalls(result.calls);
  });

  it('refuses a DATABASE_URL host query override before invoking Docker', () => {
    const result = runReset({
      databaseUrl: `${localDatabaseUrl}?host=db.example.com`,
    });

    expect(result.status).not.toBe(0);
    expectNoDestructiveCalls(result.calls);
  });

  it('refuses a DATABASE_URL port query override before invoking Docker', () => {
    const result = runReset({
      databaseUrl: `${localDatabaseUrl}?port=6543`,
    });

    expect(result.status).not.toBe(0);
    expectNoDestructiveCalls(result.calls);
  });

  it('refuses PGPORT overriding an omitted URL port before invoking Docker', () => {
    const result = runReset({
      databaseUrl: 'postgresql://reservation:reservation@localhost/reservation',
      pgPort: '6543',
    });

    expect(result.status).not.toBe(0);
    expectNoDestructiveCalls(result.calls);
  });

  it('refuses a remote DOCKER_HOST before invoking Docker', () => {
    const result = runReset({ dockerHost: 'tcp://db.example.com:2375' });

    expect(result.status).not.toBe(0);
    expectNoDestructiveCalls(result.calls);
  });

  it('refuses a context whose Docker endpoint is remote before compose down', () => {
    const result = runReset({
      contextEndpoint: 'ssh://docker.example.com',
      dockerContext: 'remote-production',
    });

    expect(result.status).not.toBe(0);
    expect(result.calls).toContainEqual([
      'context',
      'inspect',
      '--format',
      '{{.Endpoints.docker.Host}}',
      'remote-production',
    ]);
    expectNoDestructiveCalls(result.calls);
  });

  it('loads DATABASE_URL and NODE_ENV from .env before validation', () => {
    const result = runReset({
      databaseUrl: null,
      dotenv: [
        'NODE_ENV=development',
        `DATABASE_URL=${localDatabaseUrl}`,
        '',
      ].join('\n'),
      nodeEnv: null,
    });

    expect({ status: result.status, stderr: result.stderr }).toEqual({
      status: 0,
      stderr: '',
    });
    expect(result.calls).toContainEqual([
      '--context',
      'desktop-linux',
      'compose',
      '--file',
      resolve(projectRoot, 'compose.yaml'),
      '--project-name',
      'reservation-waitlist-local',
      'down',
      '--volumes',
    ]);
  });

  it('honors production from .env and refuses before invoking Docker', () => {
    const result = runReset({
      databaseUrl: null,
      dotenv: [
        'NODE_ENV=production',
        `DATABASE_URL=${localDatabaseUrl}`,
        '',
      ].join('\n'),
      nodeEnv: null,
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Database reset is disabled in production');
    expectNoDestructiveCalls(result.calls);
  });

  it('pins a validated Unix context plus the compose file and project name', () => {
    const composeFile = resolve(projectRoot, 'compose.yaml');
    const result = runReset({
      composeFile: '/tmp/unrelated-compose.yaml',
      composeProjectName: 'unrelated-project',
      contextEndpoint: 'unix:///run/user/1000/docker.sock',
      dockerContext: 'desktop-linux',
    });

    expect({ status: result.status, stderr: result.stderr }).toEqual({
      status: 0,
      stderr: '',
    });
    expect(result.calls).toEqual([
      [
        'context',
        'inspect',
        '--format',
        '{{.Endpoints.docker.Host}}',
        'desktop-linux',
      ],
      [
        '--context',
        'desktop-linux',
        'compose',
        '--file',
        composeFile,
        '--project-name',
        'reservation-waitlist-local',
        'down',
        '--volumes',
      ],
      [
        '--context',
        'desktop-linux',
        'compose',
        '--file',
        composeFile,
        '--project-name',
        'reservation-waitlist-local',
        'up',
        '--detach',
        '--wait',
      ],
    ]);
  });

  it('accepts and pins a validated local npipe context', () => {
    const result = runReset({
      contextEndpoint: 'npipe:////./pipe/docker_engine',
      dockerContext: 'desktop-windows',
    });

    expect(result.status).toBe(0);
    expect(result.calls).toContainEqual(
      expect.arrayContaining([
        '--context',
        'desktop-windows',
        'compose',
        'down',
        '--volumes',
      ]),
    );
  });

  it('accepts a local Unix DOCKER_HOST only after validating the active context', () => {
    const result = runReset({
      dockerHost: 'unix:///var/run/docker.sock',
    });

    expect(result.status).toBe(0);
    expect(result.calls.slice(0, 2)).toEqual([
      ['context', 'show'],
      [
        'context',
        'inspect',
        '--format',
        '{{.Endpoints.docker.Host}}',
        'desktop-linux',
      ],
    ]);
    expect(result.calls[2]).toEqual(
      expect.arrayContaining([
        '--context',
        'desktop-linux',
        'down',
        '--volumes',
      ]),
    );
  });

  it('refuses a local DOCKER_HOST that differs from the inspected context', () => {
    const result = runReset({
      contextEndpoint: 'unix:///run/user/1000/docker.sock',
      dockerHost: 'unix:///var/run/docker.sock',
    });

    expect(result.status).not.toBe(0);
    expect(result.calls.slice(0, 2)).toEqual([
      ['context', 'show'],
      [
        'context',
        'inspect',
        '--format',
        '{{.Endpoints.docker.Host}}',
        'desktop-linux',
      ],
    ]);
    expectNoDestructiveCalls(result.calls);
  });
});
