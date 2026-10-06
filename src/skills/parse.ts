import { isRuntime } from '../setup/config.js';
import { canPrompt } from '../setup/options.js';
import { CORE_SKILLS, isSkillSet, SET_SKILLS, SKILL_SETS } from '../setup/skill-sets.js';
import type { Io, Prompter, Runtime } from '../setup/types.js';
import { clackPrompter } from '../setup/ui.js';

const SCOPES = ['project', 'global'] as const;

/** Where a runtime already reads skills: the project directory, or the home directory. */
export type SkillScope = (typeof SCOPES)[number];

/** Raw `--runtimes`, `--scope`, and `--skills` strings after trim, before token checks. */
export interface SkillsFlagValues {
  runtimes?: string;
  scope?: string;
  skills?: string;
}

/** Flag strings, or a parse error that must exit before any prompt or write. */
export interface ParsedSkillsArgv {
  flags: SkillsFlagValues;
  error?: string;
}

/** Runtimes, scopes, and skill folder names a resolved `skills` invocation installs. */
export interface SkillChoices {
  runtimes: Runtime[];
  scopes: SkillScope[];
  skills: string[];
}

function splitList(raw: string): string[] {
  const seen: string[] = [];
  for (const part of raw.split(',')) {
    const item = part.trim();
    if (item.length === 0 || seen.includes(item)) continue;
    seen.push(item);
  }
  return seen;
}

function parseRuntimeList(raw: string): Runtime[] | undefined {
  const parts = splitList(raw);
  if (parts.length === 0) return undefined;
  const runtimes: Runtime[] = [];
  for (const part of parts) {
    if (!isRuntime(part)) return undefined;
    runtimes.push(part);
  }
  return runtimes;
}

function parseScopeList(raw: string): SkillScope[] | undefined {
  const parts = splitList(raw);
  if (parts.length === 0) return undefined;
  const scopes: SkillScope[] = [];
  for (const part of parts) {
    if (part !== 'project' && part !== 'global') return undefined;
    scopes.push(part);
  }
  return scopes;
}

function flagKey(arg: string): keyof SkillsFlagValues | undefined {
  if (arg === '--runtimes' || arg.startsWith('--runtimes=')) return 'runtimes';
  if (arg === '--scope' || arg.startsWith('--scope=')) return 'scope';
  if (arg === '--skills' || arg.startsWith('--skills=')) return 'skills';
  return undefined;
}

/**
 * Parses `skills` argv. `--flag value` and `--flag=value` both supply a value.
 * Values are trimmed; comma-separated entries are trimmed and deduped later.
 */
export function parseSkillsArgv(argv: string[]): ParsedSkillsArgv {
  const flags: SkillsFlagValues = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] ?? '';
    const key = flagKey(arg);
    if (key === undefined) return { flags, error: `unknown option "${arg}"` };

    const equals = arg.indexOf('=');
    let value: string | undefined;
    if (equals !== -1) {
      value = arg.slice(equals + 1);
    } else {
      value = argv[++i];
      if (value === undefined) return { flags, error: `missing value for --${key}` };
    }
    flags[key] = value.trim();
  }

  return { flags };
}

const SHIP_AND_DISCOVERY = [...SET_SKILLS.ship, ...SET_SKILLS.discovery];

function fail(io: Io, message: string): undefined {
  io.stderr.write(`wolven-harness skills: ${message}\n`);
  return undefined;
}

function unknownToken(raw: string, allowed: readonly string[]): string | undefined {
  return splitList(raw).find((part) => !allowed.includes(part));
}

/**
 * Expands set names to their skill folders. A core name fails as installed by
 * `setup`; any other name outside the ship and discovery skills fails as
 * unknown and still names `setup`, because this command installs neither.
 */
function expandSkills(raw: string, io: Io): string[] | undefined {
  const parts = splitList(raw);
  if (parts.length === 0 || parts.includes('none')) return fail(io, 'missing --skills');
  const skills: string[] = [];
  for (const part of parts) {
    if (isSkillSet(part)) {
      for (const name of SET_SKILLS[part]) {
        if (!skills.includes(name)) skills.push(name);
      }
      continue;
    }
    if ((CORE_SKILLS as readonly string[]).includes(part)) return fail(io, `${part} is installed by setup`);
    if (!SHIP_AND_DISCOVERY.includes(part)) {
      return fail(io, `${part} is not a ship or discovery skill; core skills are installed by setup`);
    }
    if (!skills.includes(part)) skills.push(part);
  }
  return skills;
}

function prompterFor(io: Io): Prompter {
  return io.prompts ?? clackPrompter(io);
}

async function resolveRuntimes(flags: SkillsFlagValues, io: Io, interactive: boolean): Promise<Runtime[] | undefined> {
  if (flags.runtimes !== undefined) {
    const parsed = parseRuntimeList(flags.runtimes);
    if (parsed !== undefined) return parsed;
    const bad = unknownToken(flags.runtimes, ['claude', 'codex', 'cursor']);
    if (!interactive) return fail(io, bad ?? 'missing --runtimes');
  } else if (!interactive) {
    return fail(io, 'missing --runtimes');
  }

  const answer = await prompterFor(io).multiselect<Runtime>({
    message: 'Runtimes',
    options: [
      { value: 'claude', label: 'claude' },
      { value: 'codex', label: 'codex' },
      { value: 'cursor', label: 'cursor' },
    ],
    initialValues: ['claude'],
    required: true,
  });
  if (answer === undefined) return fail(io, 'prompt cancelled');
  return answer;
}

async function resolveScopes(flags: SkillsFlagValues, io: Io, interactive: boolean): Promise<SkillScope[] | undefined> {
  if (flags.scope !== undefined) {
    const parsed = parseScopeList(flags.scope);
    if (parsed !== undefined) return parsed;
    const bad = unknownToken(flags.scope, ['project', 'global']);
    if (!interactive) return fail(io, bad ?? 'missing --scope');
  } else if (!interactive) {
    return fail(io, 'missing --scope');
  }

  const answer = await prompterFor(io).multiselect<SkillScope>({
    message: 'Scope',
    options: [
      { value: 'project', label: 'project' },
      { value: 'global', label: 'global' },
    ],
    initialValues: ['project'],
    required: true,
  });
  if (answer === undefined) return fail(io, 'prompt cancelled');
  return answer;
}

async function resolveSkills(flags: SkillsFlagValues, io: Io, interactive: boolean): Promise<string[] | undefined> {
  if (flags.skills !== undefined) return expandSkills(flags.skills, io);
  if (!interactive) return fail(io, 'missing --skills');

  const coreList = CORE_SKILLS.join(', ');
  const answer = await prompterFor(io).multiselect<string>({
    message: `Skills. Core stays installed by setup: ${coreList}. Install the harness for code-lane, adr, and qmd.`,
    options: [
      ...SKILL_SETS.map((set) => ({ value: set, label: set })),
      ...SHIP_AND_DISCOVERY.map((name) => ({ value: name, label: name })),
    ],
    initialValues: ['create-prd'],
    required: true,
  });
  if (answer === undefined) return fail(io, 'prompt cancelled');
  return expandSkills(answer.join(','), io);
}

/**
 * Resolves runtimes, then scope, then skills. A terminal re-asks an omitted
 * or invalid runtime or scope. A core skill name fails as installed by setup,
 * and an unknown skill name fails as not a ship or discovery skill.
 */
export async function resolveChoices(flags: SkillsFlagValues, io: Io): Promise<SkillChoices | undefined> {
  const interactive = canPrompt(io);
  const runtimes = await resolveRuntimes(flags, io, interactive);
  if (runtimes === undefined) return undefined;
  const scopes = await resolveScopes(flags, io, interactive);
  if (scopes === undefined) return undefined;
  const skills = await resolveSkills(flags, io, interactive);
  if (skills === undefined) return undefined;
  return { runtimes, scopes, skills };
}

/** Help for `skills --help`. Names the flags, values, ship and discovery skills, and setup for core. */
export function skillsHelpText(): string {
  return [
    'Usage: wolven-harness skills [--runtimes <claude,codex,cursor>] [--scope <project|global|project,global>] [--skills <name|ship|discovery>]',
    '',
    'Flags:',
    '  --runtimes   claude, codex, cursor',
    '  --scope      project, global, project,global',
    '  --skills     a skill name, or ship, or discovery',
    '',
    `Ship: ${SET_SKILLS.ship.join(', ')}`,
    `Discovery: ${SET_SKILLS.discovery.join(', ')}`,
    'Core skills are installed by setup.',
    '',
  ].join('\n');
}
