// why: usage is `node .agents/hooks/secret-path-guard.mjs` with one JSON hook payload on stdin; Cursor and Claude Code share it.
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { commandTouchesSecret, isSecretPath } from './secret-paths.mjs';

const RULE = '.agents/rules/secrets.md';
const DENY_EXIT = 2;
const STDIN_TIMEOUT_MS = 5000;
const PATH_FIELDS = ['file_path', 'path'];

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function denied(target) {
  return {
    decision: 'deny',
    message:
      `secret-path-guard: blocked ${target}, which is secret-shaped and must stay out of the session (${RULE}). ` +
      'This refusal is final: ask the Human for access instead of retrying another way.',
  };
}

/** The first secret-shaped target a payload's path, command or Glob pattern fields name, or undefined. */
function secretTarget(payload) {
  const toolInput = isObject(payload.tool_input) ? payload.tool_input : {};
  for (const source of [payload, toolInput]) {
    for (const field of PATH_FIELDS) {
      if (isSecretPath(source[field])) return `\`${source[field]}\``;
    }
    if (commandTouchesSecret(source.command)) return `the command \`${source.command}\``;
  }
  if (payload.tool_name === 'Glob' && isSecretPath(toolInput.pattern)) return `the pattern \`${toolInput.pattern}\``;
  return undefined;
}

/**
 * Decides one hook payload: `deny` when it names a secret-shaped path or a
 * command touching one, or when it is not a JSON object; `allow` otherwise.
 * invariant: the only outcomes are allow and deny, never a permission prompt.
 */
export function decide(payload) {
  if (!isObject(payload)) {
    return {
      decision: 'deny',
      message: `secret-path-guard: the hook payload was not a JSON object, so the tool call is denied (${RULE}).`,
    };
  }
  const target = secretTarget(payload);
  return target === undefined ? { decision: 'allow' } : denied(target);
}

function respond(result) {
  if (result.decision === 'allow') process.exit(0);
  const body = JSON.stringify({
    permission: 'deny',
    userMessage: result.message,
    agentMessage: result.message,
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: result.message,
    },
  });
  process.stderr.write(`${result.message}\n`);
  process.stdout.write(`${body}\n`, () => process.exit(DENY_EXIT));
}

function tryParse(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

function main() {
  const stdin = process.stdin;
  let text = '';
  let done = false;
  let timer;
  const finish = (parsed) => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    stdin.pause();
    stdin.destroy();
    respond(decide(parsed.ok ? parsed.value : undefined));
  };

  if (stdin.isTTY) {
    finish({ ok: false });
    return;
  }
  // hazard: a runtime may leave stdin open; without this timer the hook would wait forever.
  timer = setTimeout(() => finish({ ok: false }), STDIN_TIMEOUT_MS);
  stdin.setEncoding('utf8');
  stdin.on('data', (chunk) => {
    text += chunk;
    const parsed = tryParse(text);
    if (parsed.ok) finish(parsed);
  });
  stdin.on('end', () => finish(tryParse(text)));
  stdin.on('close', () => finish(tryParse(text)));
  stdin.on('error', () => finish({ ok: false }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
