# Hooks

Hook scripts that agent runtimes run before a tool call or at session start.
Each needs only Node, with no packages to install.

## secret-path-guard.mjs

Runs before a file read or a shell command and refuses the call when it
touches a secret-shaped path: a key or certificate, an SSH key, a `.env`
file other than `.env.example`, `.npmrc`, `.netrc`, or a `.ssh`, `.aws` or
`.config/gcloud` folder. It reads one payload on stdin and either allows the
call or denies it with a message citing `.agents/rules/secrets.md`. It never
asks for permission; a deny is final, and the agent asks the Human instead.

Run it as `node .agents/hooks/secret-path-guard.mjs` from the repo root.

`wolven-harness setup` wires it for Cursor and Claude Code when it selects
them and the runtime's hook config file does not exist yet. When that file
already exists, `setup` leaves it untouched; add the entry below by hand.

### Cursor — `.cursor/hooks.json`

Add the guard to the `beforeReadFile` and `beforeShellExecution` lists,
keeping any hooks already there:

```json
{
  "version": 1,
  "hooks": {
    "beforeReadFile": [{ "command": "node .agents/hooks/secret-path-guard.mjs" }],
    "beforeShellExecution": [{ "command": "node .agents/hooks/secret-path-guard.mjs" }]
  }
}
```

### Claude Code — `.claude/settings.json`

Add one entry to `hooks.PreToolUse`, keeping any settings already there:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Read|Grep|Glob",
        "hooks": [
          { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.agents/hooks/secret-path-guard.mjs\"" }
        ]
      }
    ]
  }
}
```

Other runtimes have no hook wired yet and rely on the
`.agents/rules/secrets.md` standing rule.

## secret-paths.mjs

The shared pattern list: `isSecretPath` classifies one path and
`commandTouchesSecret` classifies a shell command. Change the list here, and
keep `.agents/rules/secrets.md` in step with it.

## worktree-parity.mjs

Runs when a Claude Code session starts in a quiet install, and warns when
the session's folder lacks the `CLAUDE.local.md` symlink or the
`.claude/rules/` folder, which a new worktree can miss. Each warning says
nothing changed and names the next step. It always exits 0, so it never
blocks the session.

`wolven-harness setup` copies it into every install but wires it nowhere.
The `harness-init` skill adds it to `.claude/settings.local.json` under
`SessionStart` when it sets up a quiet install.
