#!/bin/sh
# Refuses a commit on, or a push to, the default branch that origin/HEAD names.
# Usage: default-branch.sh [pre-push]   (pre-push reads Git's ref tuples on stdin)
default=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD) || exit 0
default=${default#origin/}

if [ "$1" = pre-push ]; then
  while read -r _ _ ref _; do
    [ "$ref" = "refs/heads/$default" ] && blocked=1
  done
elif [ "$(git branch --show-current)" = "$default" ]; then
  blocked=1
fi

[ -z "$blocked" ] && exit 0
echo "default-branch: $default takes changes through a pull request; git switch -c <feature> first." >&2
exit 1
