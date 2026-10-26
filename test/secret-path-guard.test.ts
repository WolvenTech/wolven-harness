import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { decide } from '../templates/.agents/hooks/secret-path-guard.mjs';
import { commandTouchesSecret, isSecretPath } from '../templates/.agents/hooks/secret-paths.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const hooksDir = path.join(repoRoot, 'templates', '.agents', 'hooks');
const hookPath = path.join(hooksDir, 'secret-path-guard.mjs');

function runHook(input: string) {
  return spawnSync(process.execPath, [hookPath], { input, encoding: 'utf8', timeout: 10_000 });
}

function assertDenied(result: ReturnType<typeof runHook>) {
  assert.equal(result.signal, null, 'hook exited on its own');
  assert.equal(result.status, 2, result.stderr);
  const out = JSON.parse(result.stdout);
  assert.equal(out.permission, 'deny');
  assert.equal(out.hookSpecificOutput.permissionDecision, 'deny');
  assert.match(out.agentMessage, /secrets\.md/);
  assert.match(out.hookSpecificOutput.permissionDecisionReason, /secrets\.md/);
  assert.match(result.stderr, /secrets\.md/);
  return out;
}

function assertAllowed(result: ReturnType<typeof runHook>) {
  assert.equal(result.signal, null, 'hook exited on its own');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
}

test('proof-secret-path-guard-pattern-list: every listed pattern is secret-shaped', () => {
  for (const p of [
    'certs/client.pem',
    'server.key',
    'store.p12',
    'store.pfx',
    'android/release.keystore',
    'secrets/id_rsa',
    'id_rsa.pub',
    'id_ed25519',
    '.env',
    '.env.local',
    'apps/web/.env.production',
    '.npmrc',
    '.netrc',
    '~/.ssh/config',
    '~/.ssh',
    '$HOME/.aws/credentials',
    '~/.config/gcloud/application_default_credentials.json',
    './.ssh/x',
    '.aws/config',
    "'*.pem'",
    '**/*.pem',
    '"certs/client.pem"',
    'certs\\client.pem',
    'CERTS/CLIENT.PEM',
  ]) {
    assert.equal(isSecretPath(p), true, p);
  }
  for (const p of [
    'README.md',
    'src/keys.ts',
    'monkey',
    '.environment',
    '.config/other',
    'docs/aws.md',
    '',
    'id.txt',
  ]) {
    assert.equal(isSecretPath(p), false, p);
  }
});

test('proof-secret-path-guard-env-example-allow: .env.example is never secret-shaped', () => {
  for (const p of ['.env.example', './.env.example', 'apps/web/.env.example', '".env.example"']) {
    assert.equal(isSecretPath(p), false, p);
  }
  assert.equal(commandTouchesSecret('cat .env.example'), false);
});

test('proof-secret-path-guard-shell-forms: shell forms that reach a secret are caught', () => {
  for (const command of [
    'cat ./secrets/id_rsa',
    'head -n 5 certs/client.pem',
    "find . -name '*.pem' -exec cat {} \\;",
    'grep -r TOKEN ./.env',
    'grep -r KEY ".env.local"',
    'cat ~/.aws/credentials',
    'tail -f .env&&echo done',
    'less <.npmrc',
    'echo $(cat .netrc)',
    'curl --cert=client.pem https://example.com',
    'KEYFILE=server.key node app.js',
  ]) {
    assert.equal(commandTouchesSecret(command), true, command);
  }
  for (const command of ['cat README.md', 'cat .env.example', 'ls src', 'grep -r TODO src', '']) {
    assert.equal(commandTouchesSecret(command), false, command);
  }
});

test('proof-secret-path-guard-no-runtime-dep: Node built-ins only, no new dependency', () => {
  const pkg = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  assert.deepEqual(Object.keys(pkg.dependencies ?? {}).sort(), ['@clack/prompts', 'yaml']);

  for (const file of ['secret-paths.mjs', 'secret-path-guard.mjs']) {
    const source = readFileSync(path.join(hooksDir, file), 'utf8');
    const specifiers = [...source.matchAll(/^\s*import\b[^'"]*['"]([^'"]+)['"]/gm)].map((m) => m[1]);
    for (const specifier of specifiers) {
      assert.ok(specifier.startsWith('node:') || specifier === './secret-paths.mjs', `${file} imports ${specifier}`);
    }
    assert.doesNotMatch(source, /\brequire\(|\bimport\(/, `${file} has no dynamic import`);
  }
});

test('proof-secret-path-guard-deny-read-pem: a Read of a .pem is denied citing secrets.md', () => {
  assertDenied(runHook(JSON.stringify({ tool_name: 'Read', tool_input: { file_path: 'certs/client.pem' } })));
  assertDenied(runHook(JSON.stringify({ hook_event_name: 'beforeReadFile', file_path: 'certs/client.pem' })));
  assertDenied(runHook(JSON.stringify({ tool_name: 'Grep', tool_input: { pattern: 'x', path: '~/.ssh' } })));
  assertDenied(runHook(JSON.stringify({ tool_name: 'Glob', tool_input: { pattern: '**/*.pem' } })));
});

test('proof-secret-path-guard-deny-shell-cat: cat on id_rsa is denied before it runs', () => {
  const out = assertDenied(
    runHook(JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'cat ./secrets/id_rsa' } })),
  );
  assert.match(out.userMessage, /id_rsa/);
  assertDenied(runHook(JSON.stringify({ hook_event_name: 'beforeShellExecution', command: 'cat ./secrets/id_rsa' })));
});

test('proof-secret-path-guard-allow-env-example: a Read of .env.example is allowed', () => {
  assertAllowed(runHook(JSON.stringify({ tool_name: 'Read', tool_input: { file_path: '.env.example' } })));
  assertAllowed(runHook(JSON.stringify({ file_path: '.env.example' })));
  assertAllowed(runHook(JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'cat README.md' } })));
  assertAllowed(runHook(JSON.stringify({ tool_name: 'Glob', tool_input: { pattern: 'src/**/*.ts' } })));
});

test('secret-path-guard: malformed or empty input is denied without hanging', () => {
  for (const input of ['not json', '', '[]', 'null', '42']) {
    const result = runHook(input);
    assert.equal(result.signal, null, `exited on its own for ${JSON.stringify(input)}`);
    assert.equal(result.status, 2, `deny-safe for ${JSON.stringify(input)}`);
    assert.equal(JSON.parse(result.stdout).permission, 'deny');
  }
});

test('secret-path-guard: exits once a full payload arrives even if stdin stays open', async () => {
  const child = spawn(process.execPath, [hookPath], { stdio: ['pipe', 'pipe', 'pipe'] });
  let timer: NodeJS.Timeout | undefined;
  try {
    let stdout = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    const exited = new Promise<number | null>((resolve) => child.on('exit', (code) => resolve(code)));
    // hazard: a regression here hangs the hook, so the wait is capped and the child killed in finally.
    const timedOut = new Promise<'timeout'>((resolve) => (timer = setTimeout(() => resolve('timeout'), 4000)));
    child.stdin.write(JSON.stringify({ tool_name: 'Read', tool_input: { file_path: 'certs/client.pem' } }));
    const code = await Promise.race([exited, timedOut]);
    assert.equal(code, 2);
    assert.equal(JSON.parse(stdout).permission, 'deny');
  } finally {
    clearTimeout(timer);
    child.kill();
  }
});

test('proof-secret-path-guard-no-ask-hook: only allow or deny, never ask', () => {
  const payloads: unknown[] = [
    { tool_name: 'Read', tool_input: { file_path: 'certs/client.pem' } },
    { tool_name: 'Read', tool_input: { file_path: '.env.example' } },
    { command: 'cat ./secrets/id_rsa' },
    'not json',
  ];
  for (const payload of payloads) {
    assert.ok(['allow', 'deny'].includes(decide(payload).decision));
    const result = runHook(typeof payload === 'string' ? payload : JSON.stringify(payload));
    if (result.stdout === '') continue;
    const out = JSON.parse(result.stdout);
    assert.equal(out.permission, 'deny');
    assert.equal(out.hookSpecificOutput.permissionDecision, 'deny');
    assert.doesNotMatch(result.stdout, /"ask"/);
  }
  for (const file of ['secret-paths.mjs', 'secret-path-guard.mjs']) {
    const source = readFileSync(path.join(hooksDir, file), 'utf8');
    assert.doesNotMatch(source, /['"`]ask['"`]/, `${file} has no ask decision`);
  }
});
