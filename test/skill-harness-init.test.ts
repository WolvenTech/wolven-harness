import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { parseMarkdownTables, section } from './helpers/markdown.js';
import { flatten } from './helpers/prose.js';
import { assertNoRuntimeToolNames, assertSkillBasics, readSkill } from './helpers/skill-contract.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const STEPS = [
  '0. Entry integration',
  '1. Legacy ADR migration',
  '2. Discovery',
  '3. Research',
  '4. Suggest',
  '5. Write stubs',
  '6. Score, session note and hand-back',
];

const REFERENCES = [
  'references/entry-modes.md',
  'references/adr-migration.md',
  'references/discovery.md',
  'references/layout.md',
  'references/convention.md',
  'references/stub-template.md',
  'references/session-note-template.md',
  'references/validate-wiring.md',
  'references/harness-score.md',
  'references/lean-path.md',
];

const LEAN_PATH = 'references/lean-path.md';

const CONSUMER_NAME_RE = /agentic-mkt|compozy/i;

test('skill-shape: passes the shared skill contract checks, including the harness:validate mention', async () => {
  await assertSkillBasics('harness-init', { requireHarnessValidate: true });
});

test('skill-shape: is model-invocable, with no ask-only flag and no agents/openai.yaml', async () => {
  const skill = await readSkill('harness-init');

  assert.equal(skill.frontmatter.name, 'harness-init');
  assert.equal(typeof skill.frontmatter.description, 'string');
  assert.ok(!(skill.frontmatter.description as string).includes('|'));
  assert.equal('disable-model-invocation' in skill.frontmatter, false);
  assert.ok(!skill.files.includes('agents/openai.yaml'));
});

test('skill-shape: lists steps 0 through 6 in order', async () => {
  const skill = await readSkill('harness-init');

  const positions = STEPS.map((step) => {
    const index = skill.body.indexOf(step);
    assert.ok(index >= 0, `missing step "${step}"`);
    return index;
  });

  for (let i = 1; i < positions.length; i++) {
    assert.ok(positions[i] > positions[i - 1], `step "${STEPS[i]}" must come after "${STEPS[i - 1]}"`);
  }
});

test('skill-shape: an AGENTS.md that already holds the harness section is never folded twice', async () => {
  const flat = flatten((await readSkill('harness-init')).body);

  assert.match(flat, /never fold it a second time/i);
});

test('skill-shape: each writing step shows the diff and runs validate; one commit offer at the end, gated on a clean validate', async () => {
  const skill = await readSkill('harness-init');
  const flat = flatten(skill.body);

  assert.match(flat, /Every writing step shows the Human the diff before writing/);
  assert.match(flat, /runs `harness:validate` right after it writes/i);
  assert.match(flat, /No step offers a commit; the run makes one offer, at the end/);
  assert.match(flat, /once `harness:validate` exits 0 \(`0 legacy-warn` as well, when migration ran\)/i);
});

test('skill-shape: the references exist and are each linked from the step that uses them', async () => {
  const skill = await readSkill('harness-init');

  for (const ref of REFERENCES) {
    assert.ok(skill.files.includes(ref), `missing reference file ${ref}`);
    const escaped = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(skill.body, new RegExp(`\\[${escaped}\\]\\(${escaped}\\)`), `no link to ${ref} in the body`);
  }
});

test('skill-shape: names the other skills it consults only in backticks, never as a relative link', async () => {
  const skill = await readSkill('harness-init');

  for (const name of ['adr', 'research', 'code-commit', 'qmd', 'grilling']) {
    assert.match(skill.body, new RegExp(`\`${name}\``));
    assert.doesNotMatch(skill.body, new RegExp(`\\]\\(\\.\\./${name}/`));
  }
});

test('runtime-rules: the question gates are present under Hard gates', async () => {
  const skill = await readSkill('harness-init');
  const gates = flatten(skill.body.split(/^## Hard gates/m)[1]?.split(/^## /m)[0] ?? '');

  assert.match(gates, /one question at a time/i);
  assert.match(gates, /recommended option listed first/i);
  assert.match(gates, /never invent/i);
  assert.match(gates, /names? no specific consumer repository|no consumer names/i);
});

test('runtime-rules: no file in the harness-init folder names a real consumer repository', async () => {
  const skill = await readSkill('harness-init');

  for (const rel of skill.files) {
    const content = await skill.read(rel);
    assert.doesNotMatch(content, CONSUMER_NAME_RE, `${rel} names a consumer repository`);
  }
});

test('runtime-rules: no unguarded runtime-specific question tool name in the skill body', async () => {
  const skill = await readSkill('harness-init');
  assertNoRuntimeToolNames(skill.body);
});

test('skill-harness-init: asks how harness:validate is wired, with three options, and writes nothing without a yes', async () => {
  const skill = await readSkill('harness-init');
  const step = flatten(skill.body.split(/^### 6\. /m)[1]?.split(/^## /m)[0] ?? '');

  assert.match(step, /how should `harness:validate` be wired/i);
  assert.match(step, /\(a\) as a CI job on pull requests/);
  assert.match(step, /\(b\) chained into the repo's existing `validate` or `test` script/);
  assert.match(step, /\(c\) local only/);
  assert.match(step, /recommended option first/i);
  assert.match(step, /Nothing is written without the Human's yes/);

  const ref = flatten(await skill.read('references/validate-wiring.md'));
  for (const manager of ['npm', 'yarn', 'pnpm', 'none']) {
    assert.match(ref, new RegExp(`\\| \`${manager}\` \\|`), `${manager} has a branch`);
  }
  assert.match(ref, /Nothing is written without a yes: show the diff, wait for the Human's yes, then write/);

  const note = flatten(await skill.read('references/session-note-template.md'));
  assert.match(note, /## Validate wiring/);
});

test('skill-harness-init: step 0 never picks the entry mode silently', async () => {
  const skill = await readSkill('harness-init');
  const step = flatten(skill.body.split(/^### 0\. /m)[1]?.split(/^### /m)[0] ?? '');
  assert.match(step, /never pick it silently/i);

  const modes = flatten(await skill.read('references/entry-modes.md'));
  assert.match(modes, /Never pick a mode silently/);
});

test('skill-harness-init: step 6 scores before the wiring question and never drops a check without a yes', async () => {
  const skill = await readSkill('harness-init');
  const step = flatten(skill.body.split(/^### 6\. /m)[1]?.split(/^## /m)[0] ?? '');

  assert.match(step, /never drop one without the Human's yes/);
  assert.ok(
    step.indexOf('harness:score') < step.indexOf('harness:validate'),
    'scoring comes before the wiring question',
  );

  const ref = flatten(await skill.read('references/harness-score.md'));
  assert.match(
    ref,
    /`HYG-03`, `HYG-04` and `HYG-06` detect leaked credentials and can never be dropped\. The score step asks no dimension question about them/,
  );
  assert.match(ref, /Never build a failing check inside this run/);
  assert.match(ref, /Nothing is written without a yes/);

  const note = flatten(await skill.read('references/session-note-template.md'));
  assert.ok(note.indexOf('## Stubs') < note.indexOf('## Harness score'), 'Harness score follows Stubs');
  assert.ok(
    note.indexOf('## Harness score') < note.indexOf('## Validate wiring'),
    'Harness score precedes Validate wiring',
  );
});

test('proof-basics-path-question: the Human picks the path from one plain question, quick setup first', async () => {
  const skill = await readSkill('harness-init');
  const raw = await skill.read(LEAN_PATH);
  const question = flatten(section(raw, '## The path question'));

  assert.match(question, /"How much setup do you want right now\?"/);
  assert.ok(
    question.indexOf('Quick setup') < question.indexOf('Guided setup'),
    'Quick setup is offered before Guided setup',
  );
  assert.match(question, /\*\*Quick setup \(recommended\)\*\*: connect the harness to <runtime names>;/);
  assert.match(question, /\*\*Guided setup\*\*: walk through every step, skipping whatever you don't want yet/);
  assert.match(question, /Never pick it for them from what the tree shows/);
  assert.ok(raw.indexOf('## Resume first') < raw.indexOf('## The path question'), 'resume is checked first');

  assert.ok(skill.body.indexOf('## Re-run skips') < skill.body.indexOf('## Lean path'), 're-run skips come first');

  for (const rel of skill.files) {
    assert.doesNotMatch(await skill.read(rel), /thin-evidence/i, `${rel} still judges the path from the tree`);
  }
});

test('proof-basics-resume: a draft note resumes its path, and a stable note asks the path question again', async () => {
  const skill = await readSkill('harness-init');
  const resume = flatten(section(await skill.read(LEAN_PATH), '## Resume first'));

  assert.match(resume, /`draft` note that records a \*\*Path:\*\* resumes on that path, with the answers it records/);
  assert.match(resume, /`stable` note means an earlier run finished\. It does not block a new run/);
});

test('proof-basics-asks: the lean path asks the path question, then the AGENTS.md question in a full install, and no goal', async () => {
  const asks = flatten(section(await (await readSkill('harness-init')).read(LEAN_PATH), '## What the lean path asks'));

  assert.match(asks, /In this order, and nothing else/);
  const order = ['The path question above', 'how much to change `AGENTS.md`'];
  const positions = order.map((phrase) => {
    const index = asks.indexOf(phrase);
    assert.ok(index >= 0, `missing "${phrase}"`);
    return index;
  });
  assert.ok(positions[0] < positions[1], 'path, then AGENTS.md');
  assert.doesNotMatch(asks, /What do you want to get done first/);
});

test('proof-safety-audit-offered-last: every path asks first, promises secrets stay unread, and offers it before the commit offer', async () => {
  const skill = await readSkill('harness-init');

  assert.doesNotMatch(skill.body, /## Leaked credentials before step 0/);
  const step6 = flatten((skill.body.split(/^### 6\. /m)[1]?.split(/^## /m)[0] ?? '').replace(/^> ?/gm, ''));
  assert.match(
    step6,
    /Last step: do you want a safety audit\? The harness never opens your `\.env` or key files, and it blocks your agent from opening them\. This audit checks that protection is in place: that git ignores your `.env` files, and that no key was pasted into your MCP config or harness files, which your agent loads anyway\. It reports file names, never values\./,
  );
  assert.match(
    flatten(skill.body.replace(/^\s*> ?/gm, '')),
    /I can't find `wolven-harness` on this machine, so I can't check the setup\. Next: install it with `<install command>`, then tell me to continue\./,
  );
  assert.match(step6, /"Run the audit \(recommended\)" and "Skip it"\. Never run it unasked/);
  assert.match(step6, /read only `HYG-03`, `HYG-04` and `HYG-06`/);
  assert.match(
    step6,
    /Never open a `\.env` or key file, a flagged file or a secret-shaped file yourself, and never print a value/,
  );
  assert.match(step6, /Leave any path with a finding out of the commit offer/);
  assert.ok(
    step6.indexOf('do you want a safety audit') < step6.indexOf('make the one commit offer'),
    'the safety audit comes before the commit offer',
  );

  const score = flatten(
    section(await skill.read('references/harness-score.md'), '## Safety audit at the end of setup'),
  );
  assert.match(score, /It never opens the file/);
  assert.match(score, /Never open a flagged file or a secret-shaped file to look closer/);

  const runs = flatten(section(await skill.read(LEAN_PATH), '## What the lean path runs'));
  const check = runs.indexOf('The safety audit question');
  assert.ok(
    check > runs.indexOf('step 0, entry integration'),
    'the lean path offers the safety audit after the setup steps',
  );
  assert.match(runs, /as the last step, before the commit offer\. It runs only on a yes/);
});

test('proof-guided-no-checklist: guided setup opens with repo and role, then one step question per phase, in order', async () => {
  const skill = await readSkill('harness-init');
  const raw = section(skill.body, '## Guided setup');
  const guided = flatten(raw.replace(/^> ?/gm, ''));

  assert.match(guided, /opens with one question, "What's this repo for, and what's your role in it\?"/);
  assert.match(guided, /The options are "Run it" and "Skip it"/);
  const [table] = parseMarkdownTables(raw);
  assert.deepEqual(
    table.rows.map((row) => row[0]),
    ['Migration', 'Research', 'Skill suggestions', 'Score'],
  );
  assert.ok(
    skill.body.indexOf('## Guided setup') < skill.body.indexOf('## Workflow'),
    'guided setup comes before step 0',
  );
  assert.doesNotMatch(skill.body, /What should this run cover/);
});

test('proof-guided-skipped-is-later: a skipped step never runs and is listed for later', async () => {
  const skill = await readSkill('harness-init');
  const guided = flatten(section(skill.body, '## Guided setup'));

  assert.match(
    guided,
    /A skipped step is never asked about or run again this session: record it under \*\*Left for later\*\*/,
  );
});

test('proof-wiring-plain-labels: the wiring question asks how to check the harness, with three labels', async () => {
  const ref = flatten(await (await readSkill('harness-init')).read('references/validate-wiring.md'));

  assert.match(ref, /The question is "How should we check the harness\?"/);
  assert.match(ref, /\*\*On every pull request\*\* \(a CI job\)/);
  assert.match(ref, /\*\*With your existing checks\*\* \(chained into the existing script\)/);
  assert.match(ref, /\*\*Only when I run it\*\* \(local only\)/);
});

test('proof-quiet-install-checks-question: a quiet install offers only-when-I-run-it, then every pull request, and no existing-checks option', async () => {
  const ref = flatten(await (await readSkill('harness-init')).read('references/validate-wiring.md'));
  const section = ref.split(/### In a quiet install/)[1]?.split(/## What each answer does/)[0] ?? '';
  const first = '"Only when I run it (recommended): `wolven-harness validate`"';
  const second =
    '"On every pull request: new tracked file `.github/workflows/<file>`, which everyone with repo access sees"';

  assert.ok(section.includes(first), 'first option text');
  assert.ok(section.includes(second), 'second option text');
  assert.ok(section.indexOf(first) < section.indexOf(second), 'only-when-I-run-it comes first');
  assert.match(section, /On guided setup it also offers "Skip it"/);
  assert.match(section, /"With your existing checks" is not offered/);
});

test('proof-handback-three-parts: the hand-back says what is installed, what waits, and what to do next', async () => {
  const step6 = flatten((await readSkill('harness-init')).body.split(/^### 6\. /m)[1]?.split(/^## /m)[0] ?? '');

  assert.match(step6, /hand the run back to the Human in one closing message with three parts/);
  assert.match(
    step6,
    /\*\*What's installed:\*\* the skills and the runtimes they are ready in, the `AGENTS\.md` change/,
  );
  assert.match(step6, /\*\*Left for later:\*\* every step this run did not run/);
  assert.match(step6, /\*\*Next steps:\*\* a numbered list fitted to the installed skill sets/);
});

test('proof-handback-next-work: the hand-back asks what to work on next and starts nothing without a yes', async () => {
  const step6 = flatten((await readSkill('harness-init')).body.split(/^### 6\. /m)[1]?.split(/^## /m)[0] ?? '');

  assert.match(step6, /Nothing starts without a yes/);
});

test('proof-no-stale-lean-tests: no test still pins the replaced lean path', async () => {
  const testDir = path.join(ROOT, 'test');
  const self = path.basename(fileURLToPath(import.meta.url));
  // why: the phrases are split so this file does not match the list it guards.
  const retired = [
    ['defers exactly these', 'four items'],
    ['A declined item runs as', 'on the full path'],
    ['Skill proposals (step 4) are', 'never deferred'],
    ['shows the four', 'beats in order'],
  ].map((parts) => parts.join(' '));

  for (const name of await readdir(testDir)) {
    if (!name.endsWith('.test.ts') || name === self) continue;
    const content = await readFile(path.join(testDir, name), 'utf8');
    for (const phrase of retired) {
      assert.ok(!content.includes(phrase), `${name} still pins "${phrase}"`);
    }
  }
});

test('skill-harness-init: lean rules live only in lean-path.md, which SKILL.md loads', async () => {
  const skill = await readSkill('harness-init');

  const workflow = skill.body.split(/^## Workflow/m)[1]?.split(/^## Anti-patterns/m)[0] ?? '';
  assert.ok(workflow.length > 0, 'SKILL.md has a Workflow section');
  assert.doesNotMatch(workflow, /lean/i, 'steps 0–6 carry no lean wording');

  for (const ref of ['references/discovery.md', 'references/harness-score.md', 'references/validate-wiring.md']) {
    assert.doesNotMatch(await skill.read(ref), /lean/i, `${ref} carries no lean wording`);
  }

  assert.match(skill.body, /\[references\/lean-path\.md\]\(references\/lean-path\.md\)/);
});

test('proof-quiet-install-init-step0: the introduction comes first and step 0 is skipped in a quiet install', async () => {
  const skill = await readSkill('harness-init');
  const flat = flatten(skill.body.replace(/^> ?/gm, ''));

  const intro = 'The harness is the set of instructions, rules and doc folders';
  assert.ok(flat.includes(intro), 'SKILL.md has the introduction');
  assert.ok(flat.indexOf(intro) < flat.indexOf('## Lean path'), 'introduction comes first');
  assert.ok(flat.indexOf(intro) < flat.indexOf('## Hard gates'), 'introduction precedes the gates');

  const step = flatten(skill.body.split(/^### 0\. /m)[1]?.split(/^### /m)[0] ?? '');
  assert.match(step, /^Entry integration Skipped in a quiet install/);
});

test('proof-quiet-install-lean-path: neither install asks a goal, and guided setup runs the quiet-install section', async () => {
  const skill = await readSkill('harness-init');
  const lean = await skill.read(LEAN_PATH);
  const question = flatten(section(lean, '## The path question'));

  assert.match(question, /never call the second answer a "full tour"/);
  for (const rel of ['SKILL.md', LEAN_PATH, 'references/entry-modes.md']) {
    assert.doesNotMatch(await skill.read(rel), /Just the basics|The full tour/, `${rel} keeps the old path labels`);
  }

  const asks = flatten(section(lean, '## What the lean path asks'));
  assert.match(asks, /It asks no goal question, in either install/);
  assert.match(asks, /quiet-install section of \[layout\.md\]\(layout\.md\)/);
  const runs = flatten(section(lean, '## What the lean path runs'));
  assert.match(runs, /In a quiet install, the questions above, then the hand-back/);

  const guided = flatten(section(skill.body, '## Guided setup'));
  assert.match(guided, /guided setup then runs the quiet-install section/);
});

test('proof-quiet-install-init-agents-conflict: the harness block is three lines of text, with Yes and No only', async () => {
  const skill = await readSkill('harness-init');
  const raw = await skill.read('references/entry-modes.md');
  const part = section(raw, '## Harness block in a quiet install');
  const flat = flatten(part);

  const block = part.match(/```markdown\n([\s\S]*?)```/)?.[1] ?? '';
  const lines = block.trim().split('\n');
  assert.equal(lines[0], '<!-- wolven-harness:start -->');
  assert.equal(lines.at(-1), '<!-- wolven-harness:end -->');
  assert.ok(lines.length - 2 <= 3, 'at most three lines of text between the markers');
  assert.doesNotMatch(block, /@/, 'the default block holds no @ import');

  assert.match(flat, /never an `@` import/);
  assert.match(flat, /No other line of the file changes/);
  assert.match(flat, /On a No, nothing is written to those files/);
});

test('proof-quiet-install-init-statement: one commit offer at the end, listing only trackable paths', async () => {
  const skill = await readSkill('harness-init');
  const offer = flatten(section(skill.body, '## Commit offer').replace(/^> ?/gm, ''));

  assert.match(offer, /makes exactly one commit offer, at the end, in both installs/);
  assert.match(offer, /No phase, step, file, ADR, claim, or stub gets an offer of its own/);
  assert.match(offer, /List only paths git would track, and never force-add one/);
  assert.match(offer, /Never stage with `git add -A` or `git add \.`/);

  assert.ok(skill.body.indexOf('## Commit offer') < skill.body.indexOf('## Workflow'), 'the offer rule is stated once');
  assert.doesNotMatch(skill.body, /Phased commits|per-phase|each phase's commit|that phase's commit offer/i);
  const step6 = flatten(skill.body.split(/^### 6\. /m)[1]?.split(/^## /m)[0] ?? '');
  assert.match(step6, /make the one commit offer \(see "Commit offer"\), and hand the run back/);
});

test('proof-quiet-install-init-statement: the closing has both packaging lines, the dockerignore one first', async () => {
  const skill = await readSkill('harness-init');
  const offer = flatten(section(skill.body, '## Commit offer').replace(/^> ?/gm, ''));

  assert.match(
    offer,
    /When it added `\.wolven-harness\/` to the root `\.dockerignore`: "Docker builds skip the harness: your `\.dockerignore` now excludes `\.wolven-harness\/`\. Archives and rsync deploys need their own exclusion\."/,
  );
  assert.match(
    offer,
    /Otherwise: "Packaging that ignores `\.gitignore` \(a Docker build, an archive, an rsync deploy\) picks up the whole harness, unticked docs included\. Exclude `\.wolven-harness\/` there\."/,
  );
  assert.ok(
    offer.indexOf('When it added') < offer.indexOf('Otherwise: "Packaging'),
    'the .dockerignore condition comes before the fallback line',
  );
});

test('proof-quiet-install-init-statement: a yes goes to code-commit by path, a no commits nothing, no remote means no offer', async () => {
  const skill = await readSkill('harness-init');
  const offer = flatten(section(skill.body, '## Commit offer'));

  assert.match(offer, /On a yes, pass the listed paths by name to `code-commit`/);
  assert.match(offer, /On a no, nothing is committed and the changes stay in the working tree/);
  assert.match(offer, /When `git remote` prints nothing, make no commit offer/);
});

test('proof-quiet-install-terms-first: the session note template says you, never the Human, and keeps no retired labels', async () => {
  const skill = await readSkill('harness-init');
  const note = await skill.read('references/session-note-template.md');

  assert.doesNotMatch(note, /Just the basics|The full tour|\*\*Goal:\*\*|\*\*Covered:\*\*/);
  assert.doesNotMatch(note, /the Human/i);
  assert.doesNotMatch(note, /phase's commit offer|phase commit/);
});
