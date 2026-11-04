import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as p from '@clack/prompts';
import { RUNTIME_REGISTRY, runtimeRow } from '../setup/runtimes.js';
import type { Choice, Io, Prompter, Runtime } from '../setup/types.js';

interface HandoffPrompter extends Partial<Prompter> {
  confirm?: (opts: { message: string; initialValue?: boolean }) => Promise<boolean | undefined>;
}

/** Resolves the template SKILL.md for harness-remove from shipped package templates. */
function resolveTemplateHarnessRemoveSkill(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..', '..', 'templates', '.agents', 'skills', 'harness-remove', 'SKILL.md');
}

/**
 * Installs the harness-remove skill into the target directory for the given runtime.
 *
 * @param targetDir - The root project directory to install the skill into.
 * @param runtime - The target AI runtime whose skills path should receive harness-remove.
 * @returns The destination skill directory path.
 */
export async function installHarnessRemoveSkill(targetDir: string, runtime: Runtime): Promise<string> {
  const row = runtimeRow(runtime);
  // invariant: runtime skill paths are derived solely from RUNTIME_REGISTRY without hardcoded literals.
  const targetSkillDir = path.join(targetDir, ...row.skills.path.split('/'), 'harness-remove');
  const sourceSkillFile = resolveTemplateHarnessRemoveSkill();

  await mkdir(targetSkillDir, { recursive: true });
  await copyFile(sourceSkillFile, path.join(targetSkillDir, 'SKILL.md'));

  return targetSkillDir;
}

/**
 * Offers to install the harness-remove skill into a chosen runtime after uninstall removal completes.
 *
 * @param targetDir - The root project directory where uninstall ran.
 * @param io - Terminal I/O streams and prompter context.
 */
export async function offerSkillHandoff(targetDir: string, io: Io): Promise<void> {
  const prompter = (io.prompts ?? (io as { prompter?: HandoffPrompter }).prompter) as HandoffPrompter | undefined;

  let confirmed = false;

  if (prompter !== undefined) {
    if (typeof prompter.confirm === 'function') {
      const answer = await prompter.confirm({
        message: 'Install harness-remove skill for agent-assisted cleanup of remaining shared files?',
        initialValue: false,
      });
      confirmed = answer === true;
    } else if (typeof prompter.select === 'function') {
      const answer = await prompter.select<'yes' | 'no'>({
        message: 'Install harness-remove skill for agent-assisted cleanup of remaining shared files?',
        options: [
          { value: 'yes', label: 'yes' },
          { value: 'no', label: 'no' },
        ],
      });
      confirmed = answer === 'yes';
    }
  } else if (io.isTTY) {
    const streams = { input: io.stdin as NodeJS.ReadStream, output: io.stdout as NodeJS.WriteStream };
    try {
      const answer = await p.confirm({
        message: 'Install harness-remove skill for agent-assisted cleanup of remaining shared files?',
        initialValue: false,
        ...streams,
      });
      if (p.isCancel(answer)) return;
      confirmed = Boolean(answer);
    } catch {
      // why: fallback to decline on prompt stream error or cancellation.
      return;
    }
  }

  if (!confirmed) {
    return;
  }

  // invariant: runtime choices are derived directly from RUNTIME_REGISTRY.
  const runtimeOptions: Choice<Runtime>[] = RUNTIME_REGISTRY.map((r) => ({
    value: r.id,
    label: r.name,
  }));

  let selectedRuntime: Runtime | undefined;

  if (typeof prompter?.select === 'function') {
    selectedRuntime = await prompter.select<Runtime>({
      message: 'Select runtime to install harness-remove skill into:',
      options: runtimeOptions,
    });
  } else if (io.isTTY) {
    const streams = { input: io.stdin as NodeJS.ReadStream, output: io.stdout as NodeJS.WriteStream };
    try {
      const answer = await p.select({
        message: 'Select runtime to install harness-remove skill into:',
        options: runtimeOptions,
        ...streams,
      });
      if (!p.isCancel(answer) && typeof answer === 'string') {
        selectedRuntime = answer as Runtime;
      }
    } catch {
      // why: exit handoff on prompt stream error or cancellation.
      return;
    }
  }

  if (selectedRuntime === undefined) {
    return;
  }

  const targetSkillDir = await installHarnessRemoveSkill(targetDir, selectedRuntime);

  io.stdout.write(`\nInstalled harness-remove skill to ${targetSkillDir}\n`);
  io.stdout.write('Invocation instructions:\n');
  io.stdout.write(
    '  Ask your agent: "Run the harness-remove skill to inspect and clean up remaining harness traces."\n',
  );
}
