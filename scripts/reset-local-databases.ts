import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { parseEnv, type Env } from '../src/config/env.schema';

const allowedHosts = new Set(['localhost', '127.0.0.1']);
const allowedDatabases = new Set(['reservation', 'reservation_test']);
const projectRoot = resolve(__dirname, '..');
const composeFile = resolve(projectRoot, 'compose.yaml');
const composeProject = 'reservation-waitlist-local';

export function assertLocalResetAllowed(env: Env): void {
  if (env.NODE_ENV === 'production') {
    throw new Error('Database reset is disabled in production');
  }

  const databaseUrl = new URL(env.DATABASE_URL);
  const databaseName = databaseUrl.pathname.slice(1);

  if (!allowedHosts.has(databaseUrl.hostname)) {
    throw new Error('Database reset is limited to local hosts');
  }

  if (!allowedDatabases.has(databaseName)) {
    throw new Error('Database reset is limited to local reservation databases');
  }
}

function runDockerCompose(args: string[]): void {
  const result = spawnSync(
    'docker',
    [
      'compose',
      '--file',
      composeFile,
      '--project-name',
      composeProject,
      ...args,
    ],
    {
      cwd: projectRoot,
      stdio: 'inherit',
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (require.main === module) {
  const env = parseEnv(process.env);
  assertLocalResetAllowed(env);
  runDockerCompose(['down', '--volumes']);
  runDockerCompose(['up', '--detach', '--wait']);
}
