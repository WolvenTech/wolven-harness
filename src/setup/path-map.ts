import type { HarnessLayout } from './config.js';

export const QUIET_INSTALL_PATH_MAP = {
  'docs/': '.wolven-harness/docs/',
  '.agents/': '.wolven-harness/.agents/',
} as const;

/** Call with `linked` only after identifying a quiet install inside the repository. */
export function mapQuietInstallPaths(text: string, layout: HarnessLayout): string {
  if (layout === 'home') return text;
  return text.replace(
    /(^|[\s`'"(])(docs\/|\.agents\/)/gm,
    (_match, boundary: string, prefix: keyof typeof QUIET_INSTALL_PATH_MAP) => {
      return boundary + QUIET_INSTALL_PATH_MAP[prefix];
    },
  );
}

/** Reverses quiet-install path prefixes when carrying text into a full install. */
export function unmapQuietInstallPaths(text: string): string {
  return text.replace(/(^|[\s`'"(])\.wolven-harness\/(docs\/|\.agents\/)/gm, '$1$2');
}
