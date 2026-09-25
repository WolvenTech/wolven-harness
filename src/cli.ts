#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { runInit } from './init/index.js';
import { runValidate } from './validate/index.js';
import { runComments } from './comments/index.js';
import type { Io } from './init/types.js';

export type { Io };

function printUsage(io: Io): void {
  io.stdout.write(
    [
      'Usage: wolven-harness <command> [options]',
      '',
      'Commands:',
      '  init       Scaffold WOLVEN.md, the .agents/ source tree, and wire runtimes',
      '  validate   Check the repo against the writing profile and claim gate',
      '  comments   Judge comment lines added since a base ref [--base <ref>]',
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

  switch (command) {
    case 'init':
      return runInit(rest, io);
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
  };

  main(process.argv.slice(2), io).then((code) => {
    process.exitCode = code;
  });
}
