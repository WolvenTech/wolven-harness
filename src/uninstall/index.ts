import path from 'node:path';
import * as p from '@clack/prompts';
import type { Io } from '../setup/types.js';
import { discoverLandscape } from './discover.js';
import { removeLandscapes } from './remove.js';
import { offerSkillHandoff } from './skill-handoff.js';
import type { DiscoveredInstall } from './types.js';

const USAGE = [
  'Usage: wolven-harness uninstall [options]',
  '',
  'Scan, list, and remove harness installs while preserving docs',
  '',
  'Options:',
  '  --dir <path>  Target directory to scan (default: current directory)',
  '  --yes, -y     Skip confirmation prompt and proceed with removal',
  '  --verbose     List every removed file and empty directory',
  '  --debug       Trace steps on stderr',
].join('\n');

/** Options parsed from command-line arguments for uninstall. */
export interface UninstallOptions {
  dir: string;
  yes: boolean;
  verbose: boolean;
  debug: boolean;
}

interface ParsedArgs {
  options: UninstallOptions;
  error?: string;
  isHelp?: boolean;
}

/** Parses command-line arguments for the uninstall command. */
function parseUninstallArgs(argv: string[]): ParsedArgs {
  const options: UninstallOptions = {
    dir: '.',
    yes: false,
    verbose: false,
    debug: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] ?? '';

    if (arg === '--help' || arg === '-h') {
      return { options, isHelp: true };
    }
    if (arg === '--yes' || arg === '-y') {
      options.yes = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--debug') {
      options.debug = true;
    } else if (arg === '--dir') {
      const val = argv[++i];
      if (val === undefined || val.length === 0) {
        return { options, error: 'missing value for --dir' };
      }
      options.dir = val;
    } else if (arg.startsWith('--dir=')) {
      const val = arg.slice('--dir='.length);
      if (val.length === 0) {
        return { options, error: 'missing value for --dir' };
      }
      options.dir = val;
    } else {
      return { options, error: `unknown option "${arg}"` };
    }
  }

  return { options };
}

/** Prints the dry-run manifest of discovered installations and paths to stdout. */
function printManifest(installs: DiscoveredInstall[], io: Io): void {
  io.stdout.write('Discovered harness installations:\n');
  for (const install of installs) {
    io.stdout.write(`  • ${install.root} (${install.kind} layout)\n`);
  }

  const artifacts = [...new Set(installs.flatMap((i) => i.artifacts))].sort();
  io.stdout.write('\nArtifacts slated for deletion:\n');
  if (artifacts.length === 0) {
    io.stdout.write('  (none)\n');
  } else {
    for (const artifact of artifacts) {
      io.stdout.write(`  - ${artifact}\n`);
    }
  }

  const preservedDocs = [...new Set(installs.flatMap((i) => i.preservedDocs))].sort();
  io.stdout.write('\nPreserved documentation (will not be touched):\n');
  if (preservedDocs.length === 0) {
    io.stdout.write('  (none)\n');
  } else {
    for (const doc of preservedDocs) {
      io.stdout.write(`  ✔ ${doc}\n`);
    }
  }

  const intertwined = [...new Set(installs.flatMap((i) => i.intertwinedFiles))].sort();
  if (intertwined.length > 0) {
    io.stdout.write('\nRemaining intertwined shared files (untouched):\n');
    for (const file of intertwined) {
      io.stdout.write(`  • ${file}\n`);
    }
  }
}

/** Prompts the user for confirmation before executing removal. */
async function askConfirmation(io: Io): Promise<boolean> {
  const prompter = io.prompts;
  if (prompter !== undefined) {
    const customPrompter = prompter as {
      confirm?: (opts: { message: string; initialValue?: boolean }) => Promise<boolean | undefined>;
    };
    if (typeof customPrompter.confirm === 'function') {
      const answer = await customPrompter.confirm({
        message: 'Proceed with removal of harness artifacts?',
        initialValue: false,
      });
      return answer === true;
    }
    if (typeof prompter.select === 'function') {
      const answer = await prompter.select<'yes' | 'no'>({
        message: 'Proceed with removal of harness artifacts?',
        options: [
          { value: 'yes', label: 'yes' },
          { value: 'no', label: 'no' },
        ],
      });
      return answer === 'yes';
    }
  }

  if (io.isTTY) {
    const streams = { input: io.stdin as NodeJS.ReadStream, output: io.stdout as NodeJS.WriteStream };
    try {
      const answer = await p.confirm({
        message: 'Proceed with removal of harness artifacts?',
        initialValue: false,
        ...streams,
      });
      if (p.isCancel(answer)) return false;
      return Boolean(answer);
    } catch {
      // why: fallback to decline on prompt stream error or cancellation.
      return false;
    }
  }

  return false;
}

/**
 * Scans, lists, and deterministically removes harness installs while preserving docs.
 */
export async function runUninstall(argv: string[], io: Io): Promise<number> {
  const parsed = parseUninstallArgs(argv);

  if (parsed.isHelp) {
    io.stdout.write(`${USAGE}\n`);
    return 0;
  }

  if (parsed.error !== undefined) {
    io.stderr.write(`wolven-harness uninstall: ${parsed.error}\n`);
    io.stdout.write(`${USAGE}\n`);
    return 1;
  }

  const { options } = parsed;
  const debug = options.debug || io.env?.WOLVEN_HARNESS_DEBUG === '1';
  const targetDir = path.resolve(io.cwd, options.dir);

  if (debug) {
    io.stderr.write(`[wolven-harness:uninstall] scanning landscape in ${targetDir}\n`);
  }

  const installs = await discoverLandscape(targetDir, io.env);

  if (installs.length === 0) {
    io.stdout.write(`wolven-harness uninstall: no harness installs found in ${targetDir}\n`);
    return 0;
  }

  printManifest(installs, io);

  let confirmed = options.yes;
  if (!confirmed) {
    confirmed = await askConfirmation(io);
  }

  if (!confirmed) {
    io.stdout.write('\nwolven-harness uninstall: cancelled — no changes made\n');
    return 0;
  }

  if (debug) {
    io.stderr.write(`[wolven-harness:uninstall] removing artifacts across ${installs.length} install(s)\n`);
  }

  const results = await removeLandscapes(installs, { verbose: options.verbose, io });
  const totalRemoved = results.reduce((acc, r) => acc + r.removed.length, 0);
  const allPreserved = [...new Set(results.flatMap((r) => r.preservedDocs))].sort();
  const allRemaining = [...new Set(results.flatMap((r) => r.remainingIntertwined))].sort();
  const allFailed = results.flatMap((r) => r.failed);

  if (allFailed.length > 0) {
    io.stderr.write(`\nwolven-harness uninstall: failed to remove ${allFailed.length} item(s):\n`);
    for (const f of allFailed) {
      io.stderr.write(`  - ${f.path}: ${f.error}\n`);
    }
  }

  io.stdout.write(`\nUninstall complete: removed ${totalRemoved} harness artifact(s).\n`);
  if (allPreserved.length > 0) {
    io.stdout.write('Preserved documentation:\n');
    for (const doc of allPreserved) {
      io.stdout.write(`  ✔ ${doc}\n`);
    }
  }
  if (allRemaining.length > 0) {
    io.stdout.write('Remaining intertwined shared files (left untouched):\n');
    for (const file of allRemaining) {
      io.stdout.write(`  • ${file}\n`);
    }
  }

  await offerSkillHandoff(targetDir, io);

  return allFailed.length > 0 ? 1 : 0;
}
