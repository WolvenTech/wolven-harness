import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parse as parseYaml } from 'yaml';
import { assertSkillBasics, readSkill } from './helpers/skill-contract.js';

test('skill-code-pr: passes the shared skill contract checks', async () => {
  await assertSkillBasics('code-pr', { requireHarnessValidate: true });
});

test('skill-code-pr: ships display_name and short_description', async () => {
  const skill = await readSkill('code-pr');

  assert.ok(skill.files.includes('agents/openai.yaml'), 'expected agents/openai.yaml');

  const raw = await skill.read('agents/openai.yaml');
  const parsed = parseYaml(raw) as {
    interface?: { display_name?: string; short_description?: string };
    policy?: { allow_implicit_invocation?: boolean };
  };

  assert.ok(typeof parsed.interface?.display_name === 'string' && parsed.interface.display_name.length > 0);
  assert.ok(typeof parsed.interface?.short_description === 'string' && parsed.interface.short_description.length > 0);
});

test('skill-code-pr: title is always Conventional Commits shape', async () => {
  const skill = await readSkill('code-pr');

  assert.match(skill.body, /Conventional Commits/);
  assert.match(skill.body, /type\(scope\): summary/);
});

test('skill-code-pr: pushes every run and never merges or enables auto-merge', async () => {
  const skill = await readSkill('code-pr');

  assert.match(skill.body, /push branch/i);
  assert.match(skill.body, /every run/i);
  assert.match(skill.body, /[Nn]ever merge/);
  assert.match(skill.body, /auto-merge/i);
});

test('skill-code-pr: finds an existing PR before opening and handles zero, one, and many', async () => {
  const skill = await readSkill('code-pr');

  assert.match(skill.body, /[Zz]ero.{0,40}create/s);
  assert.match(skill.body, /[Oo]ne.{0,40}amend/s);
  assert.match(skill.body, /[Mm]ore than one.{0,60}stop and ask/is);
  assert.match(skill.body, /never open a second/i);
});

test('skill-code-pr: host steps cite host-operations.md and name the operations by plain words', async () => {
  const skill = await readSkill('code-pr');

  assert.match(skill.body, /references\/host-operations\.md/);
  assert.match(skill.body, /push branch/i);
  assert.match(skill.body, /read PR and diff/i);
  assert.match(skill.body, /open PR/);
});

test('skill-code-pr: reads before rewriting on amend', async () => {
  const skill = await readSkill('code-pr');

  assert.match(skill.body, /[Rr]ead before rewrite/);
  assert.match(skill.body, /title.{0,20}body.{0,20}comments|comments.{0,40}before replacing/is);
});

test('skill-code-pr: verification cites real evidence, N/A only for docs-only', async () => {
  const skill = await readSkill('code-pr');

  assert.match(skill.body, /real evidence|actually run/i);
  assert.match(skill.body, /N\/A.{0,60}docs-only/is);
});

test('skill-code-pr: checkbox reset before ticking from this session', async () => {
  const skill = await readSkill('code-pr');

  assert.match(skill.body, /[Cc]heckbox reset/);
  assert.match(skill.body, /\[ \]/);
});

/** Returns the content of the first ```` ```markdown ```` fence in `text`. */
function markdownFence(text: string): string {
  const match = text.match(/```markdown\n([\s\S]*?)```/);
  assert.ok(match, 'expected a ```markdown fenced block');
  return match[1];
}

/** Returns one `## <heading>` section, stopping at the next level-two heading. */
function section(body: string, heading: string): string {
  const marker = `## ${heading}`;
  const start = body.indexOf(marker);
  assert.ok(start >= 0, `expected a "${marker}" section`);
  const rest = body.slice(start + marker.length);
  const next = rest.search(/^## /m);
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}

/** Returns `text`'s non-blank lines. */
function contentLines(text: string): string[] {
  return text.split('\n').filter((line) => line.trim().length > 0);
}

test('skill-code-pr: body template pins the lean three-part shape', async () => {
  const skill = await readSkill('code-pr');
  const template = await skill.read('references/pr-body-template.md');
  const body = markdownFence(template);

  assert.deepEqual(
    [...body.matchAll(/^## (.+)$/gm)].map((match) => match[1]),
    ['Summary', 'Verification', 'Before merge'],
  );
  for (const bullet of ['What', 'Why', 'How']) {
    assert.match(section(body, 'Summary'), new RegExp(`\\*\\*${bullet}:\\*\\*`));
  }
  assert.match(template, /\[ \]/);
  assert.match(template, /checkbox reset/i);
});

test('skill-code-pr: pre-merge-closure.md moves the spec/plan and PRD folders to the exact archived paths, deprecated', async () => {
  const skill = await readSkill('code-pr');
  const closure = await skill.read('references/pre-merge-closure.md');

  assert.match(closure, /docs\/specs\/archived\/<slug>\//);
  assert.match(closure, /docs\/prds\/archived\/<slug>\//);
  assert.match(closure, /status: deprecated/);
  assert.match(closure, /status: stable/);
  assert.match(closure, /harness:validate/);
  assert.doesNotMatch(closure, /status: archived/);
});

test('skill-code-pr: pre-merge closure runs only as the last batch before merge, never mid-initiative', async () => {
  const skill = await readSkill('code-pr');
  const closure = await skill.read('references/pre-merge-closure.md');

  assert.match(closure, /last mutate batch/i);
  assert.match(closure, /never.{0,40}mid-initiative|not.{0,20}mid-initiative/is);
});

test('skill-code-pr: pre-merge closure is not needed to open or amend, only to claim merge-ready or tick closure boxes', async () => {
  const skill = await readSkill('code-pr');

  const flat = skill.body.replace(/\s+/g, ' ');
  assert.match(flat, /not needed to.{0,20}\*\*open\*\*.{0,20}\*\*amend\*\*/i);
  assert.match(flat, /needed only to claim merge-ready or to tick a closure checkbox/i);
  assert.match(skill.body, /\*\*Not a refusal:\*\*/);
});

test('skill-code-pr: prints the PR found or created and the resolved base', async () => {
  const skill = await readSkill('code-pr');
  const flat = skill.body.replace(/\s+/g, ' ');

  assert.match(flat, /[Pp]rint the PR found or created and the resolved base/);
});

test('skill-code-pr: ships a filled body example', async () => {
  const skill = await readSkill('code-pr');

  assert.match(skill.body, /## EXAMPLE — filled body/);
  const example = skill.body.slice(
    skill.body.indexOf('## EXAMPLE — filled body'),
    skill.body.indexOf('## Pragmatic-guard'),
  );

  assert.match(example, /\*\*Title:\*\* `[a-z]+(\([a-z0-9-]+\))?: .+`/);
  assert.match(example, /harness:validate/);
  assert.match(example, /## Summary/);
  assert.match(example, /\[x\]/);
  assert.match(example, /checkbox reset/i);
});

test('proof-templates-trim-pr-shape: the body is exactly Summary, Verification and Before merge', async () => {
  const skill = await readSkill('code-pr');
  const template = await skill.read('references/pr-body-template.md');
  const body = markdownFence(template);
  const summary = section(body, 'Summary');

  assert.deepEqual(
    [...body.matchAll(/^## (.+)$/gm)].map((match) => match[1]),
    ['Summary', 'Verification', 'Before merge'],
  );
  assert.match(summary, /^\*\*What:\*\*/m);
  assert.match(summary, /^\*\*Why:\*\*/m);
  assert.match(summary, /^\*\*How:\*\*/m);
  assert.equal([...summary.matchAll(/^\*\*(?:What|Why|How):\*\*/gm)].length, 3);
  assert.doesNotMatch(template, /acceptance criteri/i);

  for (const old of [
    /Summary of Changes/,
    /^## What$/m,
    /^## Why$/m,
    /^## How$/m,
    /Overview/,
    /Changes Made/,
    /\bChecklist\b/,
    /Verification & Testing/,
    /Risk & Reviewer Notes/,
  ]) {
    assert.doesNotMatch(template, old);
  }
});

test('proof-templates-trim-pr-caps: caps, command bullets and conditional lines are stated', async () => {
  const skill = await readSkill('code-pr');
  const template = await skill.read('references/pr-body-template.md');
  const body = markdownFence(template);
  const summaryLines = contentLines(section(body, 'Summary'));
  const verification = section(body, 'Verification');
  const verificationLines = contentLines(verification);
  const bullets = verificationLines.filter((line) => line.startsWith('- '));

  assert.match(template, /at most 140 characters/);
  assert.equal(summaryLines.filter((line) => /^\*\*(?:What|Why|How):\*\*/.test(line)).length, 3);
  assert.match(summaryLines[summaryLines.length - 1], /^\*\*Task:\*\*/);
  assert.match(summaryLines[summaryLines.length - 1], /only when one exists/);
  assert.ok(bullets.length >= 1 && bullets.length <= 3, `expected 1-3 Verification bullets, got ${bullets.length}`);
  for (const bullet of bullets) assert.match(bullet, /`[^`]+`/);
  assert.match(verificationLines[verificationLines.length - 1], /^\*\*Risk:\*\*/);
  assert.match(verification, /Medium or High/);
  assert.doesNotMatch(body, /\[(?:TBD|todo|fill[ -]?in)\]/i);
});

test('proof-templates-trim-pr-before-merge: two standing boxes plus the docs-triggered closure box', async () => {
  const skill = await readSkill('code-pr');
  const template = await skill.read('references/pr-body-template.md');
  const before = section(markdownFence(template), 'Before merge');

  assert.match(before, /- \[ \] Manual test/);
  assert.match(before, /- \[ \] CI green/);
  assert.match(before, /- \[ \] Pre-merge closure/);
  for (const folder of ['docs\\/specs', 'docs\\/prds', 'docs\\/adrs']) {
    assert.match(before, new RegExp(folder));
  }
  assert.match(before, /pre-merge-closure\.md/);
  assert.match(template, /checkbox reset/i);

  for (const closed of [
    'Spec and plan moved to `docs/specs/archived/<slug>/`',
    'Initiative PRD folder moved to `docs/prds/archived/<slug>/`',
    'New or amended ADRs promoted to `status: stable`',
    '`harness:validate` passes after the moves',
  ]) {
    assert.ok(!template.includes(closed), `expected the four-box closure block to be gone: ${closed}`);
  }
});

test('proof-templates-trim-pr-evidence: N/A stays valid for docs-only and commands are named', async () => {
  const skill = await readSkill('code-pr');
  const template = await skill.read('references/pr-body-template.md');

  assert.match(skill.body, /N\/A.{0,60}docs-only/is);
  assert.match(template, /N\/A.{0,60}docs-only/is);
  assert.match(template, /named with its command/i);
  assert.match(template, /`<command actually run>`/);
});

test('proof-templates-trim-pr-agree: the skill restates only the new shape', async () => {
  const skill = await readSkill('code-pr');
  const gates = skill.body.slice(skill.body.indexOf('## Hard gates'), skill.body.indexOf('## Workflow'));
  const nine = gates.slice(gates.indexOf('9. **Fill the template**'), gates.indexOf('10. **Checkbox reset**'));
  const ten = gates.slice(gates.indexOf('10. **Checkbox reset**'), gates.indexOf('11. **Pre-merge closure'));
  const twelve = gates.slice(gates.indexOf('12. **Real evidence**'));

  assert.match(nine, /Summary, Verification and Before merge/);
  assert.match(ten, /Before merge checkbox/);
  assert.match(twelve, /Verification and Before merge/);
  assert.match(gates.replace(/\s+/g, ' '), /needed only to claim merge-ready or to tick a closure checkbox/);
  for (const marker of ['Summary', 'Verification', 'Before merge']) {
    assert.match(section(skill.body, 'Pragmatic-guard'), new RegExp(marker));
  }
  for (const old of [
    /Summary of Changes/,
    /^## What$/m,
    /^## Why$/m,
    /^## How$/m,
    /Overview/,
    /Changes Made/,
    /\bChecklist\b/,
    /Verification & Testing/,
    /Risk & Reviewer Notes/,
  ]) {
    assert.doesNotMatch(skill.body, old);
  }
});

test('proof-templates-trim-pr-length: the EXAMPLE is a filled body of at most 25 lines', async () => {
  const skill = await readSkill('code-pr');
  const start = skill.body.indexOf('## EXAMPLE — filled body');
  assert.ok(start >= 0, 'expected the filled-body EXAMPLE heading');
  const example = skill.body.slice(start, skill.body.indexOf('## Pragmatic-guard', start));
  const body = markdownFence(example);
  const lines = body.replace(/\n$/, '').split('\n');
  const summary = section(body, 'Summary');
  const verification = section(body, 'Verification');
  const before = section(body, 'Before merge');
  const summaryBullets = contentLines(summary).filter((line) => /^\*\*(?:What|Why|How):\*\*/.test(line));
  const verificationBullets = contentLines(verification).filter((line) => line.startsWith('- '));

  assert.ok(lines.length <= 25, `expected at most 25 EXAMPLE lines, got ${lines.length}`);
  assert.equal(summaryBullets.length, 3);
  for (const bullet of summaryBullets) {
    assert.ok(bullet.length <= 140, `expected a Summary bullet of at most 140 characters: ${bullet}`);
  }
  assert.ok(
    verificationBullets.length >= 1 && verificationBullets.length <= 3,
    `expected 1-3 Verification bullets, got ${verificationBullets.length}`,
  );
  assert.ok(verificationBullets.some((line) => line.includes('harness:validate')));
  for (const bullet of verificationBullets) assert.match(bullet, /`[^`]+`/);
  assert.match(before, /- \[x\] Manual test/);
  assert.match(before, /- \[x\] CI green/);
  assert.match(example, /checkbox reset/i);
  assert.doesNotMatch(body, /<[^>]+>/);
});

test('proof-cloud-session-skills-code-commit-installed', async () => {
  const codePr = await readSkill('code-pr');
  const codeCi = await readSkill('code-ci');
  const closure = await codePr.read('references/pre-merge-closure.md');
  const commitInstalled =
    /A commit goes through `code-commit` when `code-commit\/SKILL\.md` is at `\.agents\/skills\/code-commit\/SKILL\.md` or `\.claude\/skills\/code-commit\/SKILL\.md` \(either project load path\)/;
  const commitStop = /When that file is on neither path, stop, name `code-commit`, and do not run `git commit`/;

  for (const text of [codePr.body, codeCi.body, closure]) {
    const flat = text.replace(/\s+/g, ' ');
    assert.match(flat, commitInstalled);
    assert.match(flat, commitStop);
    assert.match(flat, /That check does not consult the session skill list/);
  }

  assert.match(closure.replace(/\s+/g, ' '), /then push branch \(see \[host operations\]\(host-operations\.md\)\)/);
});

test('proof-cloud-session-skills-consults-stay', async () => {
  const skill = await readSkill('code-pr');
  const flat = skill.body.replace(/\s+/g, ' ');
  const consultAt = flat.indexOf('**Consult:**');
  const templateAt = flat.indexOf('**Body template:**');

  assert.ok(consultAt >= 0 && templateAt > consultAt, 'expected the consult before the body template');
  const consult = flat.slice(consultAt, templateAt);
  assert.match(
    consult,
    /Loaded means the session skill list from the runtime\. When that list includes `pragmatic-guard`/,
  );
  assert.match(consult, /A folder on disk or a remembered name is not loaded/);
  assert.doesNotMatch(consult, /pragmatic-guard was not consulted/);
  assert.doesNotMatch(consult, /That check does not consult the session skill list/);
  assert.match(flat, /That check does not consult the session skill list/);

  const closure = (await skill.read('references/pre-merge-closure.md')).replace(/\s+/g, ' ');
  assert.match(closure, /When `adr` is on the session skill list/);
});
