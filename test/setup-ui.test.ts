import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import path from 'node:path';
import { makeRepo, run } from './helpers/fixture.js';
import { walkFiles } from './helpers/walk.js';
import { detectGitHost, detectRuntimes } from '../src/setup/options.js';
import type { Prompter } from '../src/setup/types.js';

const execFileAsync = promisify(execFile);
const ANSI = /\u001b\[/;

async function withOrigin(url: string): Promise<string> {
  const dir = await makeRepo({}, { git: true });
  await execFileAsync('git', ['remote', 'add', 'origin', url], { cwd: dir });
  return dir;
}

interface Asked {
  selectInitial?: string;
  selectHints: string[];
  multiInitial?: string[];
  multiLabels: string[];
  skillsInitial?: string[];
  skillsRequired?: boolean;
  messages?: string[];
}

function fakePrompter(
  answers: { host?: 'gh' | 'bit'; runtimes?: ('claude' | 'codex' | 'cursor')[]; skills?: ('ship' | 'discovery')[] },
  asked: Asked,
): Prompter {
  return {
    async select(o) {
      (asked.messages ??= []).push(o.message);
      asked.selectInitial = o.initialValue;
      asked.selectHints = o.options.map((c) => `${c.label}|${c.hint ?? ''}`);
      return answers.host as never;
    },
    async multiselect(o) {
      (asked.messages ??= []).push(o.message);
      if (o.options.some((c) => c.value === 'ship')) {
        asked.skillsInitial = o.initialValues;
        asked.skillsRequired = o.required;
        return (answers.skills ?? o.initialValues) as never;
      }
      asked.multiInitial = o.initialValues;
      asked.multiLabels = o.options.map((c) => c.label);
      return answers.runtimes as never;
    },
  };
}

function newAsked(): Asked {
  return { selectHints: [], multiLabels: [] };
}

test('setup-ui: origin remote maps to a default git host', async () => {
  assert.equal(await detectGitHost(await withOrigin('https://github.com/acme/app.git')), 'gh');
  assert.equal(await detectGitHost(await withOrigin('git@github.com:acme/app.git')), 'gh');
  assert.equal(await detectGitHost(await withOrigin('git@bitbucket.org:acme/app.git')), 'bit');
  assert.equal(await detectGitHost(await withOrigin('https://gitlab.com/acme/app.git')), undefined);
  assert.equal(await detectGitHost(await makeRepo({}, { git: true })), undefined);
});

test('setup-ui: runtimes are detected from existing repo files', async () => {
  assert.deepEqual(await detectRuntimes(await makeRepo({}, { git: true })), []);
  assert.deepEqual(await detectRuntimes(await makeRepo({ 'CLAUDE.md': 'x\n' })), ['claude']);
  assert.deepEqual(await detectRuntimes(await makeRepo({ '.claude/settings.json': '{}' })), ['claude']);
  assert.deepEqual(await detectRuntimes(await makeRepo({ '.codex/config.toml': 'x' })), ['codex']);
  assert.deepEqual(await detectRuntimes(await makeRepo({ '.cursorrules': 'x' })), ['cursor']);
  assert.deepEqual(
    await detectRuntimes(await makeRepo({ '.cursor/rules/a.mdc': 'x', 'CLAUDE.md': 'x' })),
    ['claude', 'cursor'],
  );
});

test('setup-ui: prompts are preselected from the origin remote and existing files, and answers are saved', async () => {
  const dirWithCursor = await makeRepo({ '.cursorrules': 'x\n' }, { git: true });
  await execFileAsync('git', ['remote', 'add', 'origin', 'git@bitbucket.org:acme/app.git'], { cwd: dirWithCursor });

  const asked = newAsked();
  const result = await run(['setup'], {
    cwd: dirWithCursor,
    isTTY: true,
    prompts: fakePrompter({ host: 'bit', runtimes: ['cursor', 'codex'] }, asked),
  });

  assert.equal(result.code, 0, result.stderr);
  assert.equal(asked.selectInitial, 'bit');
  assert.deepEqual(asked.selectHints.map((h) => h.split('|')[0]), ['GitHub', 'Bitbucket']);
  assert.ok(asked.selectHints.some((h) => h.startsWith('Bitbucket') && h.includes('(detected from origin)')));
  assert.ok(!asked.selectHints.some((h) => h.startsWith('GitHub') && h.includes('detected')));
  assert.deepEqual(asked.multiInitial, ['cursor']);
  assert.deepEqual(asked.multiLabels, ['Claude Code', 'Codex', 'Cursor']);

  const config = JSON.parse(await readFile(path.join(dirWithCursor, '.wolven-harness.json'), 'utf8'));
  assert.equal(config.gitHost, 'bit');
  assert.deepEqual(config.runtimes, ['cursor', 'codex']);
  assert.match(result.stdout, /@wolven-tech\/harness/);
  assert.match(result.stdout, /Next steps/);
  assert.match(result.stdout, /Cursor and Codex/);
});

test('setup-ui: with no remote and no runtime files nothing is preselected', async () => {
  const dir = await makeRepo({}, { git: true });
  const asked = newAsked();

  const result = await run(['setup'], {
    cwd: dir,
    isTTY: true,
    prompts: fakePrompter({ host: 'gh', runtimes: ['claude'] }, asked),
  });

  assert.equal(result.code, 0, result.stderr);
  assert.equal(asked.selectInitial, undefined);
  assert.deepEqual(asked.multiInitial, []);
  assert.deepEqual(asked.skillsInitial, ['ship']);
  assert.equal(asked.skillsRequired, false);
});

test('setup-ui: a flag and saved config win over prompts, which are not shown', async () => {
  const config = JSON.stringify({ version: 1, gitHost: 'bit', runtimes: ['codex'], skillSets: ['ship'] }) + '\n';
  const dir = await makeRepo({ '.wolven-harness.json': config }, { git: true });
  const boom: Prompter = {
    async select() {
      throw new Error('select should not be asked');
    },
    async multiselect() {
      throw new Error('multiselect should not be asked');
    },
  };

  const result = await run(['setup', '--git-host', 'gh'], { cwd: dir, isTTY: true, prompts: boom });

  assert.equal(result.code, 0, result.stderr);
  const saved = JSON.parse(await readFile(path.join(dir, '.wolven-harness.json'), 'utf8'));
  assert.equal(saved.gitHost, 'gh');
  assert.deepEqual(saved.runtimes, ['codex']);
});

test('setup-ui: cancelling a prompt writes nothing and exits non-zero', async () => {
  const dir = await makeRepo({ 'README.md': '# x\n' }, { git: true });
  const before = (await walkFiles(dir)).sort();

  const cancelHost = await run(['setup'], {
    cwd: dir,
    isTTY: true,
    prompts: fakePrompter({ host: undefined }, newAsked()),
  });
  const cancelRuntimes = await run(['setup'], {
    cwd: dir,
    isTTY: true,
    prompts: fakePrompter({ host: 'gh', runtimes: undefined }, newAsked()),
  });

  for (const result of [cancelHost, cancelRuntimes]) {
    assert.equal(result.code, 1);
    assert.match(result.stdout, /Setup cancelled — nothing was written\./);
  }
  assert.deepEqual((await walkFiles(dir)).sort(), before);
});

test('setup-ui: a TTY without a real stdin and no missing values still needs flags', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['setup'], { cwd: dir, isTTY: true, input: '' });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /missing required flags: --git-host, --runtimes/);
  assert.match(result.stderr, /Hint: /);
  assert.deepEqual(await readdir(dir).then((n) => n.filter((f) => !f.startsWith('.git'))), []);
});

test('setup-ui: the step trace is hidden by default and shown with --debug or WOLVEN_HARNESS_DEBUG=1', async () => {
  const args = ['setup', '--git-host', 'gh', '--runtimes', 'codex'];

  const quiet = await run(args, { cwd: await makeRepo({}, { git: true }) });
  assert.doesNotMatch(quiet.stderr + quiet.stdout, /wolven-harness:setup\]/);

  const debug = await run([...args, '--debug'], { cwd: await makeRepo({}, { git: true }) });
  assert.equal(debug.code, 0);
  assert.match(debug.stderr, /\[wolven-harness:setup\] step resolveOptions/);
  assert.match(debug.stderr, /\[wolven-harness:setup\] step applyTemplates/);
  assert.doesNotMatch(debug.stdout, /wolven-harness:setup\]/);

  const viaEnv = await run(args, { cwd: await makeRepo({}, { git: true }), env: { WOLVEN_HARNESS_DEBUG: '1' } });
  assert.match(viaEnv.stderr, /\[wolven-harness:setup\] step wireRuntimes/);
});

test('setup-ui: non-TTY output is plain text with the summary and next steps', async () => {
  const dir = await makeRepo(
    { 'package.json': `${JSON.stringify({ name: 'consumer', version: '1.0.0' }, null, 2)}\n` },
    { git: true },
  );

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'claude,codex'], { cwd: dir });

  assert.equal(result.code, 0, result.stderr);
  assert.doesNotMatch(result.stdout, ANSI);
  assert.doesNotMatch(result.stderr, ANSI);
  assert.match(result.stdout, /✔ WOLVEN\.md/);
  assert.match(result.stdout, /✔ docs\/ folders: adrs, deferrals, notes, prds, specs/);
  assert.match(result.stdout, /✔ Claude Code wired \(CLAUDE\.md, \.claude\/skills\)/);
  assert.match(result.stdout, /✔ Codex reads \.agents\/skills\/ natively/);
  assert.match(result.stdout, /✔ package\.json scripts: harness:validate, harness:comments/);
  assert.match(result.stdout, /Next steps:\n\s+1\. Review and commit/);
  assert.match(result.stdout, /2\. Open a fresh Claude Code and Codex session/);
  assert.match(result.stdout, /pnpm harness:validate/);
  assert.match(result.stdout, /@wolven-tech\/harness/);
  assert.doesNotMatch(result.stdout, /\.agents\/skills\/adr\/SKILL\.md/);
});

test('setup-ui: summary counts come from what was really written', async () => {
  const dir = await makeRepo({}, { git: true });

  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'codex'], { cwd: dir });

  const skills = (await readdir(path.join(dir, '.agents/skills'), { withFileTypes: true })).filter((e) => e.isDirectory());
  const rules = (await readdir(path.join(dir, '.agents/rules'))).filter((f) => f.endsWith('.md'));
  assert.ok(skills.length > 1);
  assert.match(result.stdout, new RegExp(`✔ ${skills.length} skills \\(core, ship\\) and ${rules.length} rules in \\.agents/`));

  const again = await run(['setup', '--git-host', 'gh', '--runtimes', 'codex'], { cwd: dir });
  assert.doesNotMatch(again.stdout, /✔ \d+ skills/);
  assert.match(again.stdout, new RegExp(`kept your existing ${skills.length} skills \\(core, ship\\) and ${rules.length} rules in \\.agents/, left untouched`));
  assert.doesNotMatch(again.stdout, /skipped/);
});

test('setup-ui: --verbose lists every created file and default output does not', async () => {
  const args = ['setup', '--git-host', 'gh', '--runtimes', 'claude'];
  const plain = await run(args, { cwd: await makeRepo({}, { git: true }) });
  assert.doesNotMatch(plain.stdout, /\.agents\/rules\/qmd-first\.md/);

  const dir = await makeRepo({ 'CLAUDE.md': 'mine\n' }, { git: true });
  const verbose = await run([...args, '--verbose'], { cwd: dir });
  assert.equal(verbose.code, 0, verbose.stderr);
  assert.match(verbose.stdout, /^created:$/m);
  assert.match(verbose.stdout, /^ {2}\.agents\/rules\/qmd-first\.md$/m);
  assert.match(verbose.stdout, /^ {2}WOLVEN\.md$/m);
  assert.match(verbose.stdout, /^kept \(already existed, left untouched\):\n {2}CLAUDE\.md$/m);
});

test('setup-ui: errors show a one-line message plus a hint', async () => {
  const dir = await makeRepo({}, { git: true });

  const unknown = await run(['setup', '--bogus'], { cwd: dir });
  assert.equal(unknown.code, 1);
  assert.match(unknown.stderr, /^wolven-harness setup: unknown option "--bogus"$/m);
  assert.match(unknown.stderr, /Hint: Valid options: --git-host .*--runtimes .*--verbose, --debug/);

  const badHost = await run(['setup', '--git-host', 'svn', '--runtimes', 'claude'], { cwd: dir });
  assert.match(badHost.stderr, /Hint: Use "gh" for GitHub or "bit" for Bitbucket\./);
});

test('setup-ui: --help lists setup flags including --debug and --verbose', async () => {
  const result = await run(['--help'], { cwd: await makeRepo({}) });

  for (const flag of ['--git-host', '--runtimes', '--verbose', '--debug']) {
    assert.ok(result.stdout.includes(flag), `help mentions ${flag}`);
  }
});

test('setup-ui: an invalid flag value in a terminal opens its menu instead of failing', async () => {
  const asked = newAsked();
  const dir = await makeRepo({}, { git: true });
  const result = await run(['setup', '--git-host', 'gitlab', '--runtimes', 'vim', '--skills', 'extras'], {
    cwd: dir,
    isTTY: true,
    prompts: fakePrompter({ host: 'gh', runtimes: ['claude'], skills: ['ship'] }, asked),
  });

  assert.equal(result.code, 0);
  const messages = asked.messages ?? [];
  assert.ok(messages.some((m) => /^Invalid value for --git-host: "gitlab"; pick from the list instead\.\nWhere is this repository hosted\?/.test(m)));
  assert.ok(messages.some((m) => /^Invalid value for --runtimes: "vim"; pick from the list instead\.\nWhich agent runtimes/.test(m)));
  assert.ok(messages.some((m) => /^Invalid value for --skills: "extras"; pick from the list instead\.\nWhich extra skill sets/.test(m)));
  const config = JSON.parse(await readFile(path.join(dir, '.wolven-harness.json'), 'utf8'));
  assert.equal(config.gitHost, 'gh');
  assert.deepEqual(config.runtimes, ['claude']);
});

test('setup-ui: an invalid flag value off a terminal still fails with a hint', async () => {
  const dir = await makeRepo({}, { git: true });
  const result = await run(['setup', '--git-host', 'gh', '--runtimes', 'vim'], { cwd: dir });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /invalid value for --runtimes: "vim"/);
  assert.match(result.stderr, /Hint: /);
});
