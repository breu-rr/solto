# AGENTS.md

Guidance for agents working on `solto`.

## Purpose

- `solto` turns assigned Linear tickets into GitHub PRs.
- It is a Node + TypeScript service built around:
  - Hono HTTP handlers in `src/server.ts`
  - agent execution and git worktree management in `src/agent.ts`
  - Linear and GitHub integration helpers in `src/*.ts`

## Stack

- Runtime: Node LTS
- Language: TypeScript, ESM-style imports
- Package manager: `pnpm`
- Process manager: `pm2`
- Test runner: `node --import tsx --test`

## Commands

- Install deps: `pnpm install`
- Run tests: `pnpm test`
- Start locally: `pnpm start`
- Reconcile PR state: `pnpm reconcile`
- Prune stale git state: `pnpm prune`

Prefer targeted tests or focused verification when touching a narrow area, but run `pnpm test` before shipping.

## Code Style

- Keep modules small and focused.
- Prefer plain functions and simple data flow over class hierarchies.
- By default, titles and headings in Markdown or other user-facing content should follow Chicago Manual of Style title case.
- Follow the existing style:
  - early returns
  - narrow helpers
  - explicit types on exported APIs
  - minimal comments
- Keep log messages concise and operational.
- Avoid introducing dependencies unless they remove real complexity or improve correctness.

## Integration Boundaries

- One `solto` instance assumes one GitHub identity for the whole host.
- Route Linear work by persisted `linearProjectId`, not by project name or webhook path guessing.
- Shared team-level Linear webhooks should land on `/linear-webhook`.
- Treat PR attachment sync and other enrichments as best-effort unless the behavior is part of the core state machine.

## Worktrees and Cleanup

- Each issue runs in its own worktree under `workers/<project-id>/<issue-id>`.
- Do not broaden cleanup to global prune behavior when a targeted per-issue cleanup is enough.
- Never remove an issue worktree while that issue is still actively running.
- Temporary attachment context lives under `.solto-attachments-*` inside the issue worktree and must never be committed.

## Attachment Handling

- Goal: do the best reasonable job of turning attachment data into useful agent context.
- Text-like attachments should be materialized and passed through by local path.
- Image attachments should only be included when they produce real useful context, typically via summary text.
- Failed binary inference should stay quiet rather than add noise to Linear comments or prompts.
- Prefer lightweight detection and clear fallback behavior over complex file-processing pipelines.

## Linear and GitHub Behavior

- State transitions matter. Avoid changing issue/PR lifecycle behavior casually.
- When a PR is open, the issue should be `In Review`.
- When a PR is merged, the issue should move to `Done`.
- Reconcile paths should repair drift without being brittle.
- If cleanup or attachment syncing fails, prefer preserving the core workflow over failing the whole run.

## Docs and Operator UX

- Keep README high level.
- Put operational detail in `ZERO_TO_SOLTO.md`.
- Keep docs opinionated and concrete.
- Prefer one supported setup path over multiple fallback-heavy flows unless multiple paths are truly required.
- When changing operator behavior, update docs and helper scripts together.

## Testing Expectations

- Add or update tests for:
  - pure helpers
  - routing rules
  - prompt formatting
  - state transitions
- Favor narrow unit tests for deterministic logic.
- Do not add heavyweight integration scaffolding unless the change truly needs it.

## Release and Change Discipline

- Keep commits and release notes crisp and operator-facing.
- Do not mention internal housekeeping that users do not need to care about.
- When changing install, upgrade, webhook, auth, or tunnel behavior, make sure:
  - scripts
  - docs
  - doctor checks
  stay aligned.

## Avoid

- Do not add per-project GitHub identity multiplexing to a single running instance.
- Do not make webhook routing depend on fragile naming heuristics when an explicit ID exists.
- Do not add noisy Linear comments for best-effort failures that operators do not need to act on.
- Do not commit temp files, worktree artifacts, or attachment context directories.
