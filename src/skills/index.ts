import type { Io } from '../setup/types.js';
import { installChoices } from './install.js';
import { parseSkillsArgv, resolveChoices, skillsHelpText } from './parse.js';

/** True when `err` is a filesystem exception with a string `code`. */
function isFsError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && typeof (err as NodeJS.ErrnoException).code === 'string';
}

/**
 * Runs `skills`: copies chosen skill folders from the package templates
 * into the load paths named by `--skills`, `--runtimes`, and `--scope`.
 */
export async function runSkills(argv: string[], io: Io): Promise<number> {
  if (argv.length === 1 && (argv[0] === '--help' || argv[0] === '-h')) {
    io.stdout.write(skillsHelpText());
    return 0;
  }

  const parsed = parseSkillsArgv(argv);
  if (parsed.error !== undefined) {
    io.stderr.write(`wolven-harness skills: ${parsed.error}\n`);
    return 1;
  }

  const choices = await resolveChoices(parsed.flags, io);
  if (choices === undefined) return 1;

  try {
    const installed = await installChoices(choices, io);
    if (installed === 'cancelled') return 1;
  } catch (err) {
    if (!isFsError(err)) throw err;
    io.stderr.write(`wolven-harness skills: ${err.message}\n`);
    return 1;
  }
  return 0;
}
