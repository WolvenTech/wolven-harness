import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const skillsRoot = path.join(here, '..', 'templates', '.agents', 'skills');
const juryRoot = path.join(skillsRoot, 'the-jury');

const EXPECTED_JURORS = [
  'juror-proponent.md',
  'juror-skeptic.md',
  'juror-integrator.md',
  'juror-risk.md',
  'juror-evidence.md',
].sort();

test('fool-jury: the-fool requires challenges, user response, then synthesis without forcing a decision', async () => {
  const body = await readFile(path.join(skillsRoot, 'the-fool', 'SKILL.md'), 'utf8');
  assert.match(body, /3–5|3-5/);
  assert.match(body, /[Ww]ait.*[Hh]uman|[Hh]uman's response|before synthesizing/);
  assert.match(body, /[Ss]ynthesiz/);
  assert.match(body, /[Nn]ot force a decision|Do \*\*not\*\* force a decision|does not force a decision/i);
  assert.match(body, /[Mm]ode selection|Ask explicitly/);
});

test('fool-jury: the-fool ships MIT attribution', async () => {
  const notice = await readFile(path.join(skillsRoot, 'the-fool', 'NOTICE'), 'utf8');
  const license = await readFile(path.join(skillsRoot, 'the-fool', 'LICENSE'), 'utf8');
  assert.match(notice, /Jeffallan\/claude-skills/);
  assert.match(license, /MIT License/);
});

test('fool-jury: the-jury ships exactly five distinct juror agent artifacts', async () => {
  const agentsDir = path.join(juryRoot, 'agents');
  const entries = await readdir(agentsDir);
  const jurorFiles = entries.filter((name) => name.startsWith('juror-') && name.endsWith('.md')).sort();
  assert.deepEqual(jurorFiles, EXPECTED_JURORS);

  for (const name of EXPECTED_JURORS) {
    const body = await readFile(path.join(agentsDir, name), 'utf8');
    assert.match(body, /^---\nname: juror-/m, `${name}: expected juror frontmatter name`);
    assert.match(body, /[Ii]solation|[Dd]o \*\*not\*\* see other jurors/i, `${name}: expected isolation language`);
    assert.doesNotMatch(body, /agents\/openai\.yaml/);
  }

  assert.ok(!entries.includes('openai.yaml'), 'the-jury must remain model-invocable: no agents/openai.yaml');
});

test('fool-jury: the-jury requires parallel isolated first round, shared deliberation, dissent, confidence, and a concrete test', async () => {
  const body = await readFile(path.join(juryRoot, 'SKILL.md'), 'utf8');
  const spawn = await readFile(path.join(juryRoot, 'references', 'spawn-protocol.md'), 'utf8');
  const template = await readFile(path.join(juryRoot, 'references', 'verdict-template.md'), 'utf8');
  const combined = `${body}\n${spawn}\n${template}`;

  assert.match(body, /five distinct juror|exactly these five|Always use \*\*exactly these five\*\*/i);
  assert.match(combined, /[Pp]arallel/);
  assert.match(combined, /[Ii]solat/);
  assert.match(body, /[Bb]efore.*deliberat|[Dd]eliberation starts only after|only after first round/i);
  assert.match(combined, /[Ss]hared visibility|can see.*first-round|see the other four/i);
  assert.match(body, /[Dd]issent/);
  assert.match(body, /[Cc]onfidence/);
  assert.match(body, /[Cc]oncrete test/);
  assert.match(body, /[Aa]dvisory|[Hh]uman retains/);
  assert.match(spawn, /Spawn \*\*all five\*\*|all five.*same turn|parallel isolated/i);

  for (const name of EXPECTED_JURORS) {
    assert.match(body, new RegExp(name.replace('.md', '\\.md')));
  }
});

test('fool-jury: the-jury refuses single-agent persona simulation as the independence path', async () => {
  const body = await readFile(path.join(juryRoot, 'SKILL.md'), 'utf8');
  const spawn = await readFile(path.join(juryRoot, 'references', 'spawn-protocol.md'), 'utf8');
  const combined = `${body}\n${spawn}`;

  assert.match(combined, /[Nn]o persona simulation|[Rr]efuse.*persona|anti-patterns/i);
  assert.match(
    combined,
    /Do \*\*not\*\* satisfy this step by role-playing|must not fall back to persona simulation|persona simulation/i,
  );
  assert.match(combined, /cannot spawn|If the runtime cannot spawn|confirm the runtime can launch/i);

  // why: independence is false if the skill still blesses same-context
  // persona passes as the approved Round 1 path.
  assert.doesNotMatch(
    combined,
    /simulate independence by writing each|separate persona, separate pass|In a single-agent runtime, simulate/i,
  );
});
