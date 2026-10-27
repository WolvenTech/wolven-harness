const SECRET_EXTENSIONS = ['.pem', '.key', '.p12', '.pfx', '.keystore'];
const SECRET_BASENAMES = new Set(['.npmrc', '.netrc']);
const SSH_KEY_PREFIXES = ['id_rsa', 'id_ed25519'];
const SECRET_FOLDERS = new Set(['.ssh', '.aws']);
const SAFE_BASENAMES = new Set(['.env.example']);
const SHELL_OPERATORS = new Set([';', '|', '&', '<', '>', '(', ')']);

function stripQuotes(value) {
  const first = value[0];
  if (value.length >= 2 && (first === '"' || first === "'") && value.at(-1) === first) return value.slice(1, -1);
  return value;
}

function isEnvFile(base) {
  // why: a glob such as `.env*` expands to `.env` itself, so it is treated as one.
  return base === '.env' || base.startsWith('.env.') || /^\.env[*?[]/.test(base);
}

/**
 * True when `p` names a secret-shaped file or folder: a key or certificate,
 * an SSH key, a `.env` file other than `.env.example`, `.npmrc`, `.netrc`,
 * or anything under a `.ssh`, `.aws` or `.config/gcloud` folder. Globs count,
 * so `*.pem` is secret-shaped too.
 */
export function isSecretPath(p) {
  if (typeof p !== 'string') return false;
  const segments = stripQuotes(p.trim())
    .replaceAll('\\', '/')
    .split('/')
    .filter((segment) => segment !== '');
  if (segments.length === 0) return false;

  const lower = segments.map((segment) => segment.toLowerCase());
  const base = lower.at(-1);
  if (SAFE_BASENAMES.has(base)) return false;
  if (isEnvFile(base) || SECRET_BASENAMES.has(base)) return true;
  if (SECRET_EXTENSIONS.some((ext) => base.endsWith(ext))) return true;
  if (SSH_KEY_PREFIXES.some((prefix) => base.startsWith(prefix))) return true;
  return lower.some(
    (segment, i) => SECRET_FOLDERS.has(segment) || (segment === '.config' && lower[i + 1] === 'gcloud'),
  );
}

/** Splits a shell command into words, honouring quotes and backslashes; operators separate words. */
export function shellTokens(command) {
  const tokens = [];
  let current = '';
  let started = false;
  let quote = null;
  const flush = () => {
    if (started) tokens.push(current);
    current = '';
    started = false;
  };

  for (let i = 0; i < command.length; i++) {
    const ch = command[i];
    if (quote) {
      if (ch === quote) quote = null;
      else if (ch === '\\' && quote === '"' && i + 1 < command.length) current += command[++i];
      else current += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      started = true;
    } else if (ch === '\\' && i + 1 < command.length) {
      current += command[++i];
      started = true;
    } else if (/\s/.test(ch) || SHELL_OPERATORS.has(ch)) {
      flush();
    } else {
      current += ch;
      started = true;
    }
  }
  flush();
  return tokens;
}

/**
 * True when any word of a shell command, or the value side of a
 * `--opt=value` or `VAR=value` word, is a secret-shaped path.
 * Deliberately word-based: `ls id_rsa` is refused along with `cat id_rsa`.
 */
export function commandTouchesSecret(command) {
  if (typeof command !== 'string') return false;
  return shellTokens(command).some((token) => {
    if (isSecretPath(token)) return true;
    const eq = token.indexOf('=');
    return eq !== -1 && isSecretPath(token.slice(eq + 1));
  });
}
