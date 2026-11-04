export const QUIET_INSTALL_PATH_MAP = {
  'docs/': '.wolven-harness/docs/',
  '.agents/': '.wolven-harness/.agents/',
} as const;

/** Prefixes `docs/` and `.agents/` paths with the quiet-install home; call only for a quiet install. */
export function mapQuietInstallPaths(text: string): string {
  return text.replace(
    /(^|[\s`'"(])(docs\/|\.agents\/)/gm,
    (_match, boundary: string, prefix: keyof typeof QUIET_INSTALL_PATH_MAP) => {
      return boundary + QUIET_INSTALL_PATH_MAP[prefix];
    },
  );
}
