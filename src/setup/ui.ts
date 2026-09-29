import * as p from '@clack/prompts';
import type { Summary } from './summary.js';
import type { Io, Prompter } from './types.js';

/** The real prompts, drawn by `@clack/prompts` on `io`'s streams; cancel maps to `undefined`. */
export function clackPrompter(io: Io): Prompter {
  const streams = { input: io.stdin as NodeJS.ReadStream, output: io.stdout as NodeJS.WriteStream };
  return {
    async select(o) {
      const answer = await p.select({ ...streams, ...o } as Parameters<typeof p.select>[0]);
      return p.isCancel(answer) ? undefined : (answer as never);
    },
    async multiselect(o) {
      const answer = await p.multiselect({ ...streams, required: true, ...o } as Parameters<typeof p.multiselect>[0]);
      return p.isCancel(answer) ? undefined : (answer as never);
    },
  };
}

/** Everything `runSetup` says to the person; one implementation is styled, one is plain text. */
export interface Ui {
  intro(title: string, lines: string[]): void;
  /** Runs `fn` under a progress indicator labelled `label`, then marks it done as `doneLabel`. */
  phase<T>(label: string, doneLabel: string, fn: () => Promise<T>): Promise<T>;
  summary(summary: Summary): void;
  files(created: string[], kept: string[]): void;
  warn(message: string): void;
  nextSteps(steps: string[]): void;
  cancelled(): void;
  error(message: string, hint?: string): void;
}

function numbered(steps: string[]): string[] {
  return steps.map((step, i) => `${i + 1}. ${step}`);
}

function formatError(message: string, hint?: string): string {
  return `wolven-harness setup: ${message}\n${hint === undefined ? '' : `  Hint: ${hint}\n`}`;
}

/**
 * Plain-text output for pipes, CI and tests: no ANSI codes, no spinners,
 * no interactive UI. Warnings and errors go to stderr, the rest to stdout.
 */
export function plainUi(io: Io): Ui {
  const out = (text: string): void => void io.stdout.write(`${text}\n`);
  return {
    intro: (title) => out(title),
    phase: async (_label, _doneLabel, fn) => fn(),
    summary({ done, kept, notes }) {
      out('');
      for (const line of done) out(`✔ ${line}`);
      for (const line of kept) out(`• kept your existing ${line}, left untouched`);
      for (const line of notes) out(`• ${line}`);
    },
    files(created, kept) {
      out('\ncreated:');
      for (const file of created) out(`  ${file}`);
      out('kept (already existed, left untouched):');
      for (const file of kept) out(`  ${file}`);
    },
    warn: (message) => void io.stderr.write(`wolven-harness setup: note: ${message}\n`),
    nextSteps(steps) {
      out('\nNext steps:');
      for (const line of numbered(steps)) out(`  ${line}`);
    },
    cancelled: () => out('Setup cancelled — nothing was written.'),
    error: (message, hint) => void io.stderr.write(formatError(message, hint)),
  };
}

/** Styled output for an interactive terminal, drawn with `@clack/prompts` on `io.stdout`. */
export function clackUi(io: Io): Ui {
  const opts = { output: io.stdout as NodeJS.WriteStream };
  return {
    intro(title, lines) {
      p.intro(title, opts);
      p.log.message(lines.join('\n'), opts);
    },
    async phase(label, doneLabel, fn) {
      const spin = p.spinner({ ...opts, input: io.stdin as NodeJS.ReadStream });
      spin.start(label);
      try {
        const result = await fn();
        spin.stop(doneLabel);
        return result;
      } catch (err) {
        spin.error(label);
        throw err;
      }
    },
    summary({ done, kept, notes }) {
      p.note(
        [
          ...done.map((l) => `✔ ${l}`),
          ...kept.map((l) => `• kept your existing ${l}, left untouched`),
          ...notes.map((l) => `• ${l}`),
        ].join('\n'),
        'What I did',
        opts,
      );
    },
    files(created, kept) {
      const lines = [
        'created:',
        ...created.map((f) => `  ${f}`),
        'kept (already existed, left untouched):',
        ...kept.map((f) => `  ${f}`),
      ];
      p.note(lines.join('\n'), 'Files', opts);
    },
    warn: (message) => p.log.warn(message, opts),
    nextSteps(steps) {
      p.note(numbered(steps).join('\n'), 'Next steps', opts);
      p.outro("You're all set. Happy building!", opts);
    },
    cancelled: () => p.cancel('Setup cancelled — nothing was written.', opts),
    error: (message, hint) => void io.stderr.write(formatError(message, hint)),
  };
}

/** Styled output when stdout is a TTY, plain text otherwise. */
export function createUi(io: Io): Ui {
  return io.isTTY ? clackUi(io) : plainUi(io);
}
