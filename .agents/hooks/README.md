# Hooks

Add hook scripts and their wiring as the project's workflow needs them, and
document each one's trigger and purpose in this file when it is added.

## `default-branch.sh`

Wired by `simple-git-hooks` in `package.json` on `pre-commit` and `pre-push`.
It refuses a commit on, or a push to, the default branch that `origin/HEAD`
names, so changes reach it only through a pull request. Remote branch
protection is the real boundary; this catches the mistake before it leaves
the machine.
