import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { runtimeRow } from '../src/setup/runtimes.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const templatesAgentsDir = path.join(repoRoot, 'templates', '.agents');

/** Recursively lists every file under `dir`, relative to `dir`. */
function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...listFilesRecursive(full).map((rel) => path.join(entry, rel)));
    } else {
      out.push(entry);
    }
  }
  return out;
}

const relFiles = listFilesRecursive(templatesAgentsDir);
const files = relFiles.map((rel) => ({
  rel,
  abs: path.join(templatesAgentsDir, rel),
  content: readFileSync(path.join(templatesAgentsDir, rel), 'utf8'),
}));

test('seed-extract: qmd searches -c adrs first', () => {
  const qmdSkill = files.find((f) => f.rel === path.join('skills', 'qmd', 'SKILL.md'))!;
  const qmdFirstRule = files.find((f) => f.rel === path.join('rules', 'qmd-first.md'))!;

  for (const file of [qmdSkill, qmdFirstRule]) {
    const filteredIndex = file.content.indexOf('-c adrs');
    assert.ok(filteredIndex >= 0, `${file.rel} mentions -c adrs`);

    // The first unfiltered `qmd query "..."` example (no -c flag) must not
    // appear before the first `-c adrs` example.
    const unfilteredQueryRegex = /qmd query "[^"]*"(?!\s*-c)/g;
    let earliestUnfiltered = -1;
    for (const m of file.content.matchAll(unfilteredQueryRegex)) {
      // Skip if this match is actually the `-c adrs` line itself or contains -c before it on the same line.
      const lineStart = file.content.lastIndexOf('\n', m.index!) + 1;
      const line = file.content.slice(lineStart, file.content.indexOf('\n', m.index!));
      if (line.includes('-c adrs')) continue;
      earliestUnfiltered = m.index!;
      break;
    }

    if (earliestUnfiltered >= 0) {
      assert.ok(
        filteredIndex < earliestUnfiltered,
        `${file.rel}: -c adrs (at ${filteredIndex}) must appear before the unfiltered qmd query example (at ${earliestUnfiltered})`,
      );
    }
  }
});

test('seed-extract: deferrals under docs/deferrals with type deferral', () => {
  const pragmaticGuard = files.find((f) => f.rel === path.join('skills', 'pragmatic-guard', 'SKILL.md'))!;
  const yagniStrict = files.find((f) => f.rel === path.join('rules', 'yagni-strict.md'))!;

  for (const file of [pragmaticGuard, yagniStrict]) {
    assert.match(file.content, /type: deferral/, `${file.rel} specifies type: deferral`);
    assert.match(file.content, /title/, `${file.rel} mentions title field`);
    assert.match(file.content, /description/, `${file.rel} mentions description field`);
    assert.match(file.content, /status/, `${file.rel} mentions status field`);
    assert.match(file.content, /draft/, `${file.rel} mentions draft status`);
    assert.match(file.content, /stable/, `${file.rel} mentions stable status`);
    assert.match(file.content, /deprecated/, `${file.rel} mentions deprecated status`);
    assert.match(file.content, /trigger/i, `${file.rel} mentions trigger checkboxes`);
  }

  // No config-file citation anywhere in the pair.
  assert.doesNotMatch(pragmaticGuard.content, /\.config\.yml/);
  assert.doesNotMatch(yagniStrict.content, /\.config\.yml/);
});

test('seed-extract: skills have name and description', () => {
  const skillFiles = files.filter((f) => f.rel.endsWith(path.join('SKILL.md')));
  assert.ok(skillFiles.length >= 2, 'at least the qmd and pragmatic-guard skills exist');

  for (const file of skillFiles) {
    const frontmatterMatch = file.content.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(frontmatterMatch, `${file.rel} has frontmatter`);
    const frontmatter = frontmatterMatch![1];
    assert.match(frontmatter, /^name:\s*\S+/m, `${file.rel} frontmatter has name`);
    assert.match(frontmatter, /^description:\s*\S+/m, `${file.rel} frontmatter has description`);
  }
});

test('proof-secret-path-guard-manual-wiring-docs: hooks README documents the guard and its manual wiring', () => {
  const readme = files.find((f) => f.rel === path.join('hooks', 'README.md'))!;
  assert.ok(readme, 'hooks/README.md exists');

  const hookFiles = relFiles.filter(
    (rel) => rel.startsWith(`hooks${path.sep}`) && rel !== path.join('hooks', 'README.md'),
  );
  assert.deepEqual(hookFiles.sort(), [
    path.join('hooks', 'secret-path-guard.mjs'),
    path.join('hooks', 'secret-paths.mjs'),
  ]);
  for (const rel of hookFiles)
    assert.ok(readme.content.includes(`## ${path.basename(rel)}`), `README documents ${rel}`);
  assert.doesNotMatch(readme.content, /\.sh\b/, 'no shell hook ships');
  assert.match(readme.content, /\.agents\/rules\/secrets\.md/);

  const jsonBlocks = [...readme.content.matchAll(/```json\n([\s\S]*?)```/g)].map((m) => JSON.parse(m[1]) as unknown);
  for (const id of ['cursor', 'claude'] as const) {
    const hookConfig = runtimeRow(id).hookConfig!;
    assert.ok(readme.content.includes(`\`${hookConfig.path}\``), `README names ${hookConfig.path}`);
    assert.ok(
      jsonBlocks.some((block) => isDeepStrictEqual(block, JSON.parse(hookConfig.content))),
      `README shows exactly what setup writes to ${hookConfig.path}`,
    );
  }
});
