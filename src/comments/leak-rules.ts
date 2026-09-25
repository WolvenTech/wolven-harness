export type LeakKind =
  | 'change-narration'
  | 'dead-citation'
  | 'review-vantage'
  | 'reviewer-addressed'
  | 'flow-narration'
  | 'planning-id'
  | 'todo';

export type LeakRule = {
  kind: LeakKind;
  pattern: RegExp;
  says: string;
};

export const LEAK_RULES: readonly LeakRule[] = [
  {
    kind: 'change-narration',
    pattern: /\b(?:used to|previously)\b/i,
    says: 'narrates the change instead of the state',
  },
  {
    kind: 'change-narration',
    pattern: /\bthis (?:was|used to)\b/i,
    says: 'narrates the change instead of the state',
  },
  {
    kind: 'change-narration',
    pattern: /\bthe old (?:code|version|implementation|approach|way|behaviou?r)\b/i,
    says: 'refers to code that is no longer here',
  },
  {
    kind: 'change-narration',
    pattern: /\bbefore (?:this|the) (?:change|commit|fix|patch|refactor)\b/i,
    says: 'refers to a state the repository no longer holds',
  },
  {
    kind: 'dead-citation',
    pattern: /\((?:decision|item|step|phase|task|audit|option)\s*#?\d+\)/i,
    says: 'cites something only the authoring session could see',
  },
  {
    kind: 'dead-citation',
    pattern: /\bper (?:decision|item|step|phase|task|audit|option)\s*#?\d+\b/i,
    says: 'cites something only the authoring session could see',
  },
  {
    kind: 'dead-citation',
    pattern: /§\s*\d/,
    says: 'cites a section of a document that is not in the repository',
  },
  {
    kind: 'dead-citation',
    pattern: /\bas (?:decided|agreed|discussed|mentioned|described) (?:above|earlier|previously|before)\b/i,
    says: 'points at a conversation the reader cannot see',
  },
  {
    kind: 'dead-citation',
    pattern: /\b(?:per|from|in) the plan\b|\bthe plan above\b/i,
    says: 'points at a plan that is not in the repository',
  },
  {
    kind: 'dead-citation',
    pattern: /\bproof-R\d+\b/i,
    says: 'ties a proof id to a requirement number outside this repository',
  },
  {
    kind: 'dead-citation',
    pattern: /\bU-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+\b/,
    says: 'cites a disposition id that lives only outside this repository',
  },
  {
    kind: 'review-vantage',
    pattern: /\bthis (?:PR|MR|commit|patch|diff|changeset)\b/i,
    says: 'speaks from the change rather than from the repository',
  },
  {
    kind: 'review-vantage',
    pattern: /\ba (?:later|follow-?up|subsequent) (?:PR|MR|commit)\b/i,
    says: 'speaks from the change rather than from the repository',
  },
  {
    kind: 'reviewer-addressed',
    pattern: /\bthis is (?:safe|correct|fine|ok|okay)\b/i,
    says: 'argues its own correctness to a reviewer instead of stating the invariant',
  },
  {
    kind: 'reviewer-addressed',
    pattern: /\brejected in review\b|\bthe reviewer\b/i,
    says: 'records who said what, which the repository cannot confirm',
  },
  {
    kind: 'flow-narration',
    pattern: /\bfirst (?:we|it|this)\b[\s\S]{0,80}\bthen (?:we|it|this)\b/i,
    says: 'restates the control flow the code already shows',
  },
  {
    kind: 'planning-id',
    pattern: /\bR\d+(?:\.\d+)?\b/,
    says: 'cites planning context a package reader never sees',
  },
  {
    kind: 'planning-id',
    pattern: /\b[SQ]\d{1,2}\b/,
    says: 'cites planning context a package reader never sees',
  },
  {
    kind: 'planning-id',
    pattern: /\bproof-[a-z0-9-]+/i,
    says: 'cites planning context a package reader never sees',
  },
  {
    kind: 'planning-id',
    pattern: /\bunit \d+\b/i,
    says: 'cites planning context a package reader never sees',
  },
  {
    kind: 'planning-id',
    pattern: /\b(?:later|previous|next) (?:unit|wave|step)s?\b/i,
    says: 'cites planning context a package reader never sees',
  },
  {
    kind: 'planning-id',
    pattern: /\bwave [A-D]?\d\b/i,
    says: 'cites planning context a package reader never sees',
  },
  {
    kind: 'planning-id',
    pattern: /\borchestrator\b/i,
    says: 'cites planning context a package reader never sees',
  },
  {
    kind: 'planning-id',
    pattern: /\bbuilder\b/i,
    says: 'cites planning context a package reader never sees',
  },
  {
    kind: 'planning-id',
    pattern: /\bthe Human\b/,
    says: 'cites planning context a package reader never sees',
  },
  {
    kind: 'planning-id',
    pattern: /\b(?:spec|Entrega) [A-D]\b/i,
    says: 'cites planning context a package reader never sees',
  },
  {
    kind: 'todo',
    pattern: /@todo\b/i,
    says: 'defers the work instead of describing what holds now',
  },
] as const;

export type Leak = { kind: LeakKind; says: string; match: string };

export function findLeaks(blockText: string): Leak[] {
  const leaks: Leak[] = [];
  for (const rule of LEAK_RULES) {
    const found = rule.pattern.exec(blockText);
    if (found !== null) {
      leaks.push({ kind: rule.kind, says: rule.says, match: found[0] });
    }
  }
  return leaks;
}

export function firstLeak(blockText: string): Leak | null {
  return findLeaks(blockText)[0] ?? null;
}

export function leakReason(leak: Leak): string {
  return `unresolvable comment — ${leak.says} (\`${leak.match}\`)`;
}
