import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { mapQuietInstallPaths, QUIET_INSTALL_PATH_MAP } from '../src/setup/path-map.js';

test('proof-quiet-install-fixed-map: exactly two prefixes', () => {
  assert.deepEqual(QUIET_INSTALL_PATH_MAP, {
    'docs/': '.wolven-harness/docs/',
    '.agents/': '.wolven-harness/.agents/',
  });
  const text = 'docs/adrs/ and .agents/skills/ and .qmd/index.yml';
  assert.equal(
    mapQuietInstallPaths(text),
    '.wolven-harness/docs/adrs/ and .wolven-harness/.agents/skills/ and .qmd/index.yml',
  );
});

test('proof-quiet-install-pathmap-boundary: rewrites only at path-token starts', () => {
  for (const boundary of ['', '\n', ' ', '\t', '\r\n', '`', "'", '"', '(']) {
    for (const prefix of ['docs/', '.agents/'] as const) {
      assert.equal(mapQuietInstallPaths(`${boundary}${prefix}x`), `${boundary}.wolven-harness/${prefix}x`);
    }
  }
  const unchanged = 'site/docs/ https://example.com/docs/ mydocs/ site/.agents/ my.agents/ [docs/ /docs/';
  assert.equal(mapQuietInstallPaths(unchanged), unchanged);
  assert.equal(
    mapQuietInstallPaths('`docs/adrs/` and (docs/specs/x)'),
    '`.wolven-harness/docs/adrs/` and (.wolven-harness/docs/specs/x)',
  );
});

test('quiet-install path map is idempotent', () => {
  const text = 'docs/adrs/\n`.agents/skills/` (docs/specs/x) site/docs/';
  const mapped = mapQuietInstallPaths(text);
  assert.equal(mapQuietInstallPaths(mapped), mapped);
});

/**
 * Installed skill text keeps its true root paths: a path that means the repository
 * root is written with a `./` prefix so the map skips it.
 */
test('proof-iter1-root-paths: mapping the real layout and doctor skills leaves root paths at the root', () => {
  const root = new URL('../templates/.agents/skills/', import.meta.url);
  const rootSentences = [
    ['harness-init/references/layout.md', 'per skill in `./.agents/skills/`'],
    ['harness-init/references/layout.md', '| Codex | `./.agents/skills/<name>` |'],
    [
      'harness-init/references/layout.md',
      '| Antigravity | `./.agents/skills/<name>`, `./.agents/rules/wolven-harness.md` |',
    ],
  ] as const;
  for (const [file, sentence] of rootSentences) {
    const mapped = mapQuietInstallPaths(readFileSync(new URL(file, root), 'utf8'));
    assert.ok(mapped.includes(sentence), `${file}: ${sentence}`);
    assert.ok(
      !mapped.includes(sentence.replaceAll('`./', '`.wolven-harness/')),
      `${file}: ${sentence} gained the prefix`,
    );
  }
});
