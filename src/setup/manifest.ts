import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { resolveOwnPackage } from './own-package.js';

/** Name of the install manifest, beside `.wolven-harness.json`. */
export const MANIFEST_FILENAME = '.wolven-harness.manifest.json';

/** Relative path (posix, `/`-joined) to the lowercase hex sha-256 of a file's bytes. */
export type ManifestFiles = Record<string, string>;

/** Receives the exact bytes of each regular file a setup step creates. */
export interface WriteRecorder {
  record(rel: string, content: string): void;
}

/** A {@link WriteRecorder} whose collected entries can be written to the manifest. */
export interface ManifestRecorder extends WriteRecorder {
  recorded(): ManifestFiles;
}

/** Lowercase hex sha-256 of `content` as it is written to disk (UTF-8). */
function sha256(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Creates a recorder for one `setup` run. A path recorded twice keeps its
 * first hash, so re-recording a file cannot change what was written.
 */
export function createWriteRecorder(): ManifestRecorder {
  const files = new Map<string, string>();
  return {
    record(rel, content) {
      if (!files.has(rel)) files.set(rel, sha256(content));
    },
    recorded() {
      const sorted = [...files.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
      return Object.fromEntries(sorted);
    },
  };
}

/**
 * Reads the `files` of an existing manifest, or `undefined` when it is
 * absent, unreadable or malformed. Entries whose hash is not a string are
 * dropped rather than trusted.
 */
async function readExistingFiles(root: string): Promise<ManifestFiles | undefined> {
  let raw: string;
  try {
    raw = await readFile(path.join(root, MANIFEST_FILENAME), 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw err;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return undefined;

  const files = (parsed as { files?: unknown }).files;
  if (typeof files !== 'object' || files === null || Array.isArray(files)) return undefined;

  const entries = Object.entries(files).filter((entry): entry is [string, string] => typeof entry[1] === 'string');
  return Object.fromEntries(entries);
}

/**
 * Writes `.wolven-harness.manifest.json` for this run: every regular file
 * the writing steps created, hashed as written. Existing entries are kept
 * byte-for-byte and only new paths are appended, so a re-run changes
 * nothing. why: `setup` rewrites `.wolven-harness.json` before the
 * recording starts, symlinks are not regular files, and a manifest cannot
 * record itself, so none of those three is an entry.
 *
 * A malformed existing manifest is replaced by this run's entries: it is
 * consumer-editable, and setup cannot merge what it cannot read.
 */
export async function writeManifest(root: string, recorder: ManifestRecorder): Promise<void> {
  const existing = (await readExistingFiles(root)) ?? {};
  const files: ManifestFiles = { ...existing };
  for (const [rel, hash] of Object.entries(recorder.recorded())) {
    if (!Object.hasOwn(files, rel)) files[rel] = hash;
  }

  const { version } = await resolveOwnPackage();
  const body = { version: 1, packageVersion: version, files };
  await writeFile(path.join(root, MANIFEST_FILENAME), `${JSON.stringify(body, null, 2)}\n`, 'utf8');
}
