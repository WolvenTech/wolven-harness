#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { runComments } from './comments/index.js';
import { runSetup } from './setup/index.js';
import { resolveOwnPackage } from './setup/own-package.js';
import type { Io } from './setup/types.js';
import { runValidate } from './validate/index.js';

function printUsage(io: Io): void {
  io.stdout.write(
    [
      'Usage: wolven-harness <command> [options]',
      '',
      'Commands:',
      '  setup      Scaffold WOLVEN.md, the .agents/ source tree, and wire runtimes',
      '             [--git-host <gh|bit>] [--runtimes <claude,codex,cursor>]',
      '             [--skills <ship,discovery|none>]  extra skill sets (core is always installed)',
      '             [--skill <name>]  add one skill by folder name, repeatable (see --list-skills)',
      '             [--list-skills]  print the skill catalog and exit, writing nothing',
      '             [--verbose] list every file created or kept',
      '             [--debug]   trace each step on stderr (or WOLVEN_HARNESS_DEBUG=1)',
      '  validate   Check the repo against the writing profile and claim gate',
      '  comments   Judge comment lines added since a base ref [--base <ref>]',
      '',
      '  --version, -v  Print the package name and version',
      '',
      'Run "wolven-harness --help" to see this message.',
      '',
    ].join('\n'),
  );
}

export async function main(argv: string[], io: Io): Promise<number> {
  const [command, ...rest] = argv;

  if (!command || command === '--help' || command === '-h') {
    printUsage(io);
    return 0;
  }

  if (command === '--version' || command === '-v') {
    const { name, version } = await resolveOwnPackage();
    io.stdout.write(`${name} ${version}\n`);
    return 0;
  }

  switch (command) {
    case 'setup':
      return runSetup(rest, io);
    case 'validate':
      return runValidate(rest, io);
    case 'comments':
      return runComments(rest, io);
    default:
      io.stderr.write(`wolven-harness: unknown command "${command}"\n\n`);
      printUsage(io);
      return 1;
  }
}

/**
 * True when this module is the process entry point, robust to symlinks
 * (pnpm installs `bin` entries as symlinks into `.bin/`).
 */
function isMain(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    const entryUrl = pathToFileURL(realpathSync(entry)).href;
    return import.meta.url === entryUrl;
  } catch {
    return false;
  }
}

if (isMain()) {
  const io: Io = {
    cwd: process.cwd(),
    stdin: process.stdin,
    stdout: process.stdout,
    stderr: process.stderr,
    isTTY: Boolean(process.stdout.isTTY),
    env: process.env,
  };

  main(process.argv.slice(2), io).then((code) => {
    process.exitCode = code;
  });
}
