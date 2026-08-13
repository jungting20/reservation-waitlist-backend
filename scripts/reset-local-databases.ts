import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { parseEnv, type Env } from '../src/config/env.schema';

const allowedHosts = new Set(['localhost', '127.0.0.1']);
const allowedDatabases = new Set(['reservation', 'reservation_test']);
const projectRoot = resolve(__dirname, '..');
const composeFile = resolve(projectRoot, 'compose.yaml');
const composeProject = 'reservation-waitlist-local';
const dockerContextNamePattern = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/;
const dockerEndpointTemplate = '{{.Endpoints.docker.Host}}';

export function assertLocalResetAllowed(
  env: Env,
  environment: NodeJS.ProcessEnv = process.env,
): void {
  if (env.NODE_ENV === 'production') {
    throw new Error('Database reset is disabled in production');
  }

  const databaseUrl = new URL(env.DATABASE_URL);
  const databaseName = databaseUrl.pathname.slice(1);

  if (
    databaseUrl.searchParams.has('host') ||
    databaseUrl.searchParams.has('port')
  ) {
    throw new Error('Database reset does not allow host or port URL overrides');
  }

  if (!allowedHosts.has(databaseUrl.hostname)) {
    throw new Error('Database reset is limited to local hosts');
  }

  const databasePort = databaseUrl.port || environment.PGPORT || '5432';

  if (databasePort !== '5432') {
    throw new Error('Database reset is limited to PostgreSQL port 5432');
  }

  if (!allowedDatabases.has(databaseName)) {
    throw new Error('Database reset is limited to local reservation databases');
  }
}

function dockerCommandEnvironment(
  environment: NodeJS.ProcessEnv,
): NodeJS.ProcessEnv {
  const sanitizedEnvironment = { ...environment };

  delete sanitizedEnvironment.COMPOSE_FILE;
  delete sanitizedEnvironment.COMPOSE_PROJECT_NAME;
  delete sanitizedEnvironment.DOCKER_CONTEXT;
  delete sanitizedEnvironment.DOCKER_HOST;

  return sanitizedEnvironment;
}

function exitForDockerFailure(status: number | null): never {
  process.exit(status ?? 1);
}

function runDockerForOutput(
  args: string[],
  environment: NodeJS.ProcessEnv,
): string {
  const result = spawnSync('docker', args, {
    cwd: projectRoot,
    encoding: 'utf8',
    env: environment,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    if (result.stderr) {
      process.stderr.write(result.stderr);
    }
    exitForDockerFailure(result.status);
  }

  return result.stdout.trim();
}

function normalizeLocalDockerEndpoint(
  endpoint: string,
  source: string,
): string {
  const trimmedEndpoint = endpoint.trim();
  const normalizedEndpoint = trimmedEndpoint.toLowerCase();
  const isLocalUnixSocket =
    normalizedEndpoint.startsWith('unix:///') &&
    normalizedEndpoint.length > 'unix:///'.length;
  const isLocalNamedPipe = normalizedEndpoint.startsWith('npipe:////./pipe/');

  if (!isLocalUnixSocket && !isLocalNamedPipe) {
    throw new Error(`${source} must use a local Unix socket or named pipe`);
  }

  return isLocalNamedPipe
    ? normalizedEndpoint
    : `unix://${trimmedEndpoint.slice('unix://'.length)}`;
}

function resolveValidatedDockerContext(
  environment: NodeJS.ProcessEnv,
  commandEnvironment: NodeJS.ProcessEnv,
): string {
  const dockerHost =
    environment.DOCKER_HOST === undefined
      ? undefined
      : normalizeLocalDockerEndpoint(environment.DOCKER_HOST, 'DOCKER_HOST');

  const contextName =
    environment.DOCKER_CONTEXT?.trim() ||
    runDockerForOutput(['context', 'show'], commandEnvironment);

  if (!dockerContextNamePattern.test(contextName)) {
    throw new Error('Docker context name is invalid');
  }

  const contextEndpoint = normalizeLocalDockerEndpoint(
    runDockerForOutput(
      ['context', 'inspect', '--format', dockerEndpointTemplate, contextName],
      commandEnvironment,
    ),
    'Docker context endpoint',
  );

  if (dockerHost !== undefined && dockerHost !== contextEndpoint) {
    throw new Error('DOCKER_HOST must match the validated Docker context');
  }

  return contextName;
}

function runDockerCompose(
  contextName: string,
  args: string[],
  environment: NodeJS.ProcessEnv,
): void {
  const result = spawnSync(
    'docker',
    [
      '--context',
      contextName,
      'compose',
      '--file',
      composeFile,
      '--project-name',
      composeProject,
      ...args,
    ],
    {
      cwd: projectRoot,
      env: environment,
      stdio: 'inherit',
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    exitForDockerFailure(result.status);
  }
}

if (require.main === module) {
  const env = parseEnv(process.env);
  assertLocalResetAllowed(env, process.env);
  const commandEnvironment = dockerCommandEnvironment(process.env);
  const dockerContext = resolveValidatedDockerContext(
    process.env,
    commandEnvironment,
  );

  runDockerCompose(dockerContext, ['down', '--volumes'], commandEnvironment);
  runDockerCompose(
    dockerContext,
    ['up', '--detach', '--wait'],
    commandEnvironment,
  );
}
