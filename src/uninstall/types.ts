import type { Config } from '../setup/config.js';

/** The layout classification of a discovered harness installation. */
export type HarnessLandscapeKind = 'quiet' | 'full' | 'linked' | 'standalone';

/**
 * A discovered harness installation and its associated files across the
 * local landscape.
 */
export interface DiscoveredInstall {
  kind: HarnessLandscapeKind;
  /** Repository root or install base directory. */
  root: string;
  /** Directory holding harness scaffolding (.wolven-harness or root). */
  harnessHome: string;
  /** Absolute path to .wolven-harness.json if present. */
  configPath?: string;
  /** Parsed configuration if present and valid. */
  config?: Config;
  /** Harness-owned files, symlinks, and directories to delete upon confirmation. */
  artifacts: string[];
  /** Author-created documentation directories to strictly preserve. */
  preservedDocs: string[];
  /** Shared repository files containing harness references that require human inspection. */
  intertwinedFiles: string[];
}
