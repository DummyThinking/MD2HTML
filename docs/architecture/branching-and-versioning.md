# Branching & versioning

How branches, version bumps, tags, and the changelog work together. This is
a cross-cutting decision, not version-scoped — it applies from the first
commit onward unless a later decision here supersedes it.

## Branches

- `master` — always releasable. Only `dev/<MAJOR.MINOR>` branches merge into
  it, via a regular (non-squash) merge, tagged on merge.
- `dev/<MAJOR.MINOR>` — one per minor version. Cut from
  `master`; the commit that cuts it bumps `MAJOR`/`MINOR` by hand (e.g.
  `dev/0.7` begins at `0.7.0`). Not deleted after merging to `master` — kept
  around so it can be reopened for hotfixes to that version later.
- `feat/*`, `chore/*`, `fix/*`, etc. — branch off the active `dev/*` branch
  (never off `master` directly), merge back into it. Conventional prefixes,
  no fixed list — pick the one that matches the change.
- Hotfix to an already-shipped version: reopen that version's
  `dev/<MAJOR.MINOR>` from its tag, branch `fix/*` off *that*, merge back,
  tag, merge to `master`. Then forward-port the fix (merge or cherry-pick)
  into whatever `dev/*` is currently active — otherwise it's silently lost
  once that version ships.

## Versioning

Version lives in whichever manifest the project actually uses
(`package.json`, `composer.json`, `pyproject.toml`, `Cargo.toml`,
`Directory.Build.props` for C#, ...) as `MAJOR.MINOR.PATCH`.

- `MAJOR`/`MINOR` — manual, once, in the commit that cuts a `dev/*` branch.
- `PATCH` — bumped by the [`.githooks/pre-commit`](../../.githooks/pre-commit)
  hook on every commit that touches non-doc files, on any branch that isn't
  `dev/*` or `master` (those are where `MAJOR`/`MINOR` get bumped by hand
  instead). Never bump `PATCH` by hand while the hook is enabled.
- Doc-only changes (`docs/`, `*.md`, `.claude/`) never bump the version —
  the hook skips them.
- If a version-file merge conflicts (two branches both bumped `PATCH` off
  the same `dev/*` base), resolve by keeping the higher number — normally
  already `dev`'s — then let the hook bump once more for the merge commit.
  Not worth automating further until it's a recurring problem in practice.

## Changelog

`CHANGELOG.md`, [Keep a Changelog](https://keepachangelog.com/) format.
Updated as the last commit on a branch before its PR is considered done —
and again, still as the last commit, any time the branch picks up more
commits after the PR is already open.

## Tags

Every `dev/* → master` merge is tagged with the version it carries in
(`vMAJOR.MINOR.PATCH`).
