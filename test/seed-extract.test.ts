import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

function findMatches(regex: RegExp): { rel: string; match: string }[] {
  const hits: { rel: string; match: string }[] = [];
  for (const file of files) {
    const found = file.content.match(regex);
    if (found) {
      hits.push({ rel: file.rel, match: found[0] });
    }
  }
  return hits;
}

test('seed-extract: template files exist', () => {
  assert.ok(files.length > 0, 'templates/.agents has at least one file');
  const relSet = new Set(relFiles.map((r) => r.split(path.sep).join('/')));
  assert.ok(relSet.has('skills/qmd/SKILL.md'));
  assert.ok(relSet.has('skills/pragmatic-guard/SKILL.md'));
  assert.ok(relSet.has('rules/qmd-first.md'));
  assert.ok(relSet.has('rules/yagni-strict.md'));
  assert.ok(relSet.has('hooks/README.md'));
});

test('seed-extract: no source-repo collection or config words', () => {
  // why: the source repo's QMD collections were named canon, concepts, and sources; plain English uses of those words are fine.
  const hits = findMatches(/\bcanon\b|docs\/(canon|concepts|sources)\b|-c (canon|concepts|sources)\b|config\.yml/);
  assert.deepEqual(hits, [], `unexpected source-repo collection/config words: ${JSON.stringify(hits)}`);
});

test('seed-extract: no residue', () => {
  // Case-insensitive, matches
  // `rg -i "clickup|board-|area-context|wayfind|okf-qmd-kit|docs/canon|pragmatic-guard.config" templates/.agents`.
  const hits = findMatches(
    /clickup|board-|area-context|wayfind|okf-qmd-kit|docs\/canon|pragmatic-guard\.config/i,
  );
  assert.deepEqual(hits, [], `unexpected residue: ${JSON.stringify(hits)}`);
});

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
  const pragmaticGuard = files.find(
    (f) => f.rel === path.join('skills', 'pragmatic-guard', 'SKILL.md'),
  )!;
  const yagniStrict = files.find((f) => f.rel === path.join('rules', 'yagni-strict.md'))!;

  for (const file of [pragmaticGuard, yagniStrict]) {
    assert.match(file.content, /docs\/deferrals\//, `${file.rel} references docs/deferrals/`);
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

test('seed-extract: hooks README names no hook', () => {
  const readme = files.find((f) => f.rel === path.join('hooks', 'README.md'))!;
  assert.ok(readme, 'hooks/README.md exists');

  // No hook filenames.
  assert.doesNotMatch(readme.content, /\.sh\b/);
  assert.doesNotMatch(readme.content, /\.json\b/);

  // No lifecycle hook event names.
  assert.doesNotMatch(
    readme.content,
    /PreToolUse|PostToolUse|UserPromptSubmit|SessionStart|SessionEnd|Notification|Stop|SubagentStop/,
  );
});
