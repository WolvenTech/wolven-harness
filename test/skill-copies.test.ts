import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const INSTALLED = path.join(ROOT, '.agents', 'skills');
const TEMPLATE = path.join(ROOT, 'templates', '.agents', 'skills');

async function skillDirs(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

async function filesUnder(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => path.relative(dir, path.join(e.parentPath, e.name)))
    .sort();
}

test('proof-lean-init-copies-identical: installed and template copies of every shared skill are identical', async () => {
  const templateNames = new Set(await skillDirs(TEMPLATE));
  const shared = (await skillDirs(INSTALLED)).filter((name) => templateNames.has(name)).sort();
  assert.ok(shared.includes('harness-init'), 'harness-init must exist in both skill trees');

  const differences: string[] = [];
  for (const name of shared) {
    const installed = await filesUnder(path.join(INSTALLED, name));
    const template = await filesUnder(path.join(TEMPLATE, name));
    for (const file of new Set([...installed, ...template])) {
      const rel = path.join(name, file);
      if (!installed.includes(file)) differences.push(`${rel}: missing from .agents/skills/`);
      else if (!template.includes(file)) differences.push(`${rel}: missing from templates/.agents/skills/`);
      else {
        const [a, b] = await Promise.all([readFile(path.join(INSTALLED, rel)), readFile(path.join(TEMPLATE, rel))]);
        if (!a.equals(b)) differences.push(`${rel}: contents differ`);
      }
    }
  }

  assert.deepEqual(differences, [], `skill copies differ:\n${differences.join('\n')}`);
});

test('proof-approval-summary-wiring; proof-approval-summary-drift', async () => {
  const { assertApprovalWorkflow, assertApprovalMirror } = await import('./helpers/skill-contract.js');
  for (const tree of [INSTALLED, TEMPLATE]) {
    const canonicalPath = path.join(tree, 'code-spec/references/approval-summary.md');
    const mirrorPath = path.join(tree, 'create-prd/references/approval-summary.md');
    const canonical = await readFile(canonicalPath, 'utf8');
    const mirror = await readFile(mirrorPath, 'utf8');
    assertApprovalMirror(mirrorPath, canonical, mirror);
    assert.throws(() => assertApprovalMirror(mirrorPath, canonical, `${mirror}drift`), /create-prd.*approval-summary/);
    for (const name of ['create-prd', 'code-spec', 'code-plan']) {
      const file = path.join(tree, name, 'SKILL.md');
      const body = await readFile(file, 'utf8');
      const link =
        name === 'code-plan' ? '../code-spec/references/approval-summary.md' : 'references/approval-summary.md';
      assertApprovalWorkflow(file, body, link);
      for (const altered of [
        body.replace('Before asking for approval', 'After approval'),
        body.replace('first draft', 'draft'),
        body.replace('material revision', 'revision'),
        body.replace(link, 'missing.md'),
      ]) {
        assert.throws(
          () => assertApprovalWorkflow(file, altered, link),
          (error: Error) => error.message.includes(file),
        );
      }
    }
  }
});

test('proof-approval-summary-format; proof-approval-summary-empty; proof-approval-summary-human-gate; proof-approval-summary-revision; proof-approval-summary-open-feedback', async () => {
  const ref = (await readFile(path.join(INSTALLED, 'code-spec/references/approval-summary.md'), 'utf8')).replace(
    /\s+/g,
    ' ',
  );
  for (const pattern of [
    /link the real artifact.*status and commit state.*requirements.*material findings.*Human decisions.*where each landed.*open items.*decision requested/i,
    /confirmed problem.*Entrega \/ Resultado esperado \/ Casos de aceite.*one row per story.*case count/i,
    /source and scope.*technical flow.*Mermaid.*affected surfaces.*obligation IDs.*named proofs and evidence/i,
    /one row per wave.*one row per obligation/i,
    /wave blocks and gates.*what each gate blocks.*horizontal divider before the first wave, between waves, and after the last/i,
    /only for a single wave or fewer than ten units overall.*unit, dependency, owned paths, `Subagent`, and Done when/i,
    /empty findings or open items as “None”/i,
    /first draft, omit the delta/i,
    /do not invent a wave for unphased work/i,
    /Human gate separately from automatic gates.*who decides, what they decide, and what waits.*automatic checks and stop conditions/i,
    /material revision.*same summary.*link the revised artifact.*concise delta.*map decisions.*remaining questions, typed Unresolved rows, and Human gates/i,
    /pending feedback in open items, separate from incorporated changes/i,
  ])
    assert.match(ref, pattern);
});
