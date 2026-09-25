import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { PassThrough } from 'node:stream';
import { main } from '../../src/cli.js';
import type { Io } from '../../src/init/types.js';

const execFileAsync = promisify(execFile);

const GIT_ENV = {
  GIT_AUTHOR_NAME: 'Wolven Test',
  GIT_AUTHOR_EMAIL: 'wolven-test@example.com',
  GIT_COMMITTER_NAME: 'Wolven Test',
  GIT_COMMITTER_EMAIL: 'wolven-test@example.com',
};

/**
 * Creates a temp fixture repo under `os.tmpdir()`, writes `files` (map of
 * relative path -> content), and, when `opts.git` is true, `git init`s it
 * with a local test identity and one commit.
 */
export async function makeRepo(files: Record<string, string>, opts: { git?: boolean } = {}): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'wolven-harness-'));

  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, content, 'utf8');
  }

  if (opts.git) {
    const env = { ...process.env, ...GIT_ENV };
    await execFileAsync('git', ['init', '-q'], { cwd: dir, env });
    await execFileAsync('git', ['config', 'user.name', GIT_ENV.GIT_AUTHOR_NAME], { cwd: dir, env });
    await execFileAsync('git', ['config', 'user.email', GIT_ENV.GIT_AUTHOR_EMAIL], { cwd: dir, env });
    await execFileAsync('git', ['add', '-A'], { cwd: dir, env });
    await execFileAsync('git', ['commit', '-q', '-m', 'fixture', '--allow-empty'], { cwd: dir, env });
  }

  return dir;
}

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

/**
 * Calls `main` in-process with captured stdout/stderr streams, so tests
 * never spawn a subprocess.
 */
export async function run(
  args: string[],
  opts: { cwd: string; isTTY?: boolean; input?: string },
): Promise<RunResult> {
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  const stdin = new PassThrough();

  let stdoutData = '';
  let stderrData = '';
  stdout.on('data', (chunk) => {
    stdoutData += chunk.toString();
  });
  stderr.on('data', (chunk) => {
    stderrData += chunk.toString();
  });

  if (opts.input !== undefined) {
    stdin.end(opts.input);
  }

  const io: Io = {
    cwd: opts.cwd,
    stdin,
    stdout,
    stderr,
    isTTY: opts.isTTY ?? false,
  };

  const code = await main(args, io);
  return { code, stdout: stdoutData, stderr: stderrData };
}
