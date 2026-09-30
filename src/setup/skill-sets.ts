/** The optional skill sets a person can opt in or out of; core is always installed. */
export type SkillSet = 'ship' | 'discovery';

/** Every set name in display order, core first. */
export const SET_ORDER = ['core', 'ship', 'discovery'] as const;

/** Skill folders under `.agents/skills/` that every install gets. */
export const CORE_SKILLS: readonly string[] = [
  'harness-init',
  'adr',
  'grilling',
  'pragmatic-guard',
  'qmd',
  'research',
  'code-spec',
  'code-plan',
  'code-execute',
];

/**
 * The single table of skill sets. Together with `CORE_SKILLS` it must
 * partition the template skill folders exactly; a test enforces that, so a
 * new skill without a set fails the build.
 */
export const SET_SKILLS: Record<SkillSet, readonly string[]> = {
  ship: ['code-commit', 'code-pr', 'code-review', 'code-ci'],
  discovery: ['create-prd', 'prototype', 'handoff', 'the-fool', 'the-jury'],
};

/** Optional sets in display order. */
export const SKILL_SETS: readonly SkillSet[] = ['ship', 'discovery'];

export function isSkillSet(value: unknown): value is SkillSet {
  return typeof value === 'string' && (SKILL_SETS as readonly string[]).includes(value);
}

/** Sorts and dedupes `sets` into display order. */
export function orderSets(sets: readonly SkillSet[]): SkillSet[] {
  return SKILL_SETS.filter((s) => sets.includes(s));
}

/** Skill folder names for core plus the chosen `sets`. */
export function skillFolders(sets: readonly SkillSet[]): string[] {
  return [...CORE_SKILLS, ...sets.flatMap((s) => SET_SKILLS[s])];
}

/** Names (`core`, `ship`, `discovery`) of the sets that own at least one of `skills`. */
export function setsOf(skills: readonly string[]): string[] {
  return SET_ORDER.filter((name) => {
    const owned = name === 'core' ? CORE_SKILLS : SET_SKILLS[name];
    return skills.some((s) => owned.includes(s));
  });
}
