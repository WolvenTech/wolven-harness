import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { mapQuietInstallPaths, QUIET_INSTALL_PATH_MAP, unmapQuietInstallPaths } from '../src/setup/path-map.js';

test('proof-quiet-install-fixed-map: exactly two prefixes, with home text unchanged', () => {
  assert.deepEqual(QUIET_INSTALL_PATH_MAP, {
    'docs/': '.wolven-harness/docs/',
    '.agents/': '.wolven-harness/.agents/',
  });
  const text = 'docs/adrs/ and .agents/skills/ and .qmd/index.yml';
  assert.equal(mapQuietInstallPaths(text, 'home'), text);
  assert.equal(
    mapQuietInstallPaths(text, 'linked'),
    '.wolven-harness/docs/adrs/ and .wolven-harness/.agents/skills/ and .qmd/index.yml',
  );
});

test('proof-quiet-install-pathmap-boundary: rewrites only at path-token starts', () => {
  for (const boundary of ['', '\n', ' ', '\t', '\r\n', '`', "'", '"', '(']) {
    for (const prefix of ['docs/', '.agents/'] as const) {
      assert.equal(mapQuietInstallPaths(`${boundary}${prefix}x`, 'linked'), `${boundary}.wolven-harness/${prefix}x`);
    }
  }
  const unchanged = 'site/docs/ https://example.com/docs/ mydocs/ site/.agents/ my.agents/ [docs/ /docs/';
  assert.equal(mapQuietInstallPaths(unchanged, 'linked'), unchanged);
  assert.equal(
    mapQuietInstallPaths('`docs/adrs/` and (docs/specs/x)', 'linked'),
    '`.wolven-harness/docs/adrs/` and (.wolven-harness/docs/specs/x)',
  );
});

test('quiet-install path map is idempotent and reverses for a layout switch', () => {
  const text = 'docs/adrs/\n`.agents/skills/` (docs/specs/x) site/docs/';
  const mapped = mapQuietInstallPaths(text, 'linked');
  assert.equal(mapQuietInstallPaths(mapped, 'linked'), mapped);
  assert.equal(unmapQuietInstallPaths(mapped), text);
  const unchanged = 'site/.wolven-harness/docs/ https://example.com/.wolven-harness/.agents/';
  assert.equal(unmapQuietInstallPaths(unchanged), unchanged);
});

/**
 * Installed skill text keeps its true root paths: a path that means the repository
 * root is written with a `./` prefix so the map skips it.
 */
test('proof-iter1-root-paths: mapping the real layout and doctor skills leaves root paths at the root', () => {
  const root = new URL('../templates/.agents/skills/', import.meta.url);
  const rootSentences = [
    ['harness-init/references/layout.md', 'to the root `./docs/`'],
    ['harness-init/references/layout.md', 'back to `./docs/`'],
    ['harness-init/references/layout.md', 'back to `./.agents/`'],
    ['harness-init/references/layout.md', 'per skill in `./.agents/skills/`'],
    ['harness-init/references/layout.md', '| Codex | `./.agents/skills/<name>` |'],
    [
      'harness-init/references/layout.md',
      '| Antigravity | `./.agents/skills/<name>`, `./.agents/rules/wolven-harness.md` |',
    ],
    ['harness-doctor/SKILL.md', '(`./docs/` → `.wolven-harness/docs/` and `./.agents/` →'],
  ] as const;
  for (const [file, sentence] of rootSentences) {
    const mapped = mapQuietInstallPaths(readFileSync(new URL(file, root), 'utf8'), 'linked');
    assert.ok(mapped.includes(sentence), `${file}: ${sentence}`);
    assert.ok(
      !mapped.includes(sentence.replaceAll('`./', '`.wolven-harness/')),
      `${file}: ${sentence} gained the prefix`,
    );
  }
});
