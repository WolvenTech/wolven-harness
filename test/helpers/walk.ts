import { readdir } from 'node:fs/promises';
import path from 'node:path';

/**
 * Lists every regular file under `dir` as `/`-separated paths relative to
 * `dir`. A directory named `.git` is not descended into, so a fixture
 * listing stays the files the test wrote.
 */
export async function walkFiles(dir: string): Promise<string[]> {
  const out: string[] = [];

  async function walk(relDir: string): Promise<void> {
    const entries = await readdir(path.join(dir, relDir), { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.git') continue;
      const rel = relDir.length === 0 ? entry.name : `${relDir}/${entry.name}`;
      if (entry.isDirectory()) await walk(rel);
      else if (entry.isFile()) out.push(rel);
    }
  }

  await walk('');
  return out;
}
