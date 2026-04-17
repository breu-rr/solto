![solto banner](./assets/readme-banner.jpg)

# solto [![Test](https://github.com/breu-rr/solto/actions/workflows/test.yml/badge.svg)](https://github.com/breu-rr/solto/actions/workflows/test.yml)

Free, self-hosted and open source alternative to Linear Agents that turns tickets into PRs.

Solto is ideal for solo developers looking to build momentum on their ideas.

## Demo

<p align="center">
  <video src="https://github.com/user-attachments/assets/67de91de-d874-4b8d-9578-5d8cf5ff2d8a" muted playsinline></video>
</p>

<p align="center">
  <small>quick demo of how to manage a GitHub repository via Linear with solto</small>
</p>

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/breu-rr/solto/main/install.sh | bash
```

Run it as root, or prefix it with `sudo` if needed. The installer needs root because it installs host packages and creates the locked-down `agent` user. After that, solto itself runs as `agent`, not root.

## Upgrade

```bash
cd ~/solto
./scripts/upgrade.sh
```

That upgrades to the latest available release, refreshes dependencies and reloads `pm2`. For the full setup and operations guide, including `latest`, `main` and pinned-tag examples, see [ZERO_TO_SOLTO.md](./ZERO_TO_SOLTO.md).

If you want a preview first:

```bash
bash install.sh --dry-run
./scripts/upgrade.sh --dry-run
```

That guide also covers the simplest Cloudflare setup path with `./scripts/setup-tunnel.sh <your-host>.<your-domain>`.

After install or any auth/config change, run:

```bash
./scripts/doctor.sh
```

It verifies the local env, project config, repo access, pm2 state, Linear token and local `/health` + `/status`.

For a quick local sanity check:

```bash
pnpm test
```

The lightweight test suite covers local state persistence plus a few pure status/log helpers. It also runs in GitHub Actions for every pull request and every push to `main`.

## How It Works

1. You assign a Linear issue to your dedicated bot user, such as `solto-bot`.
2. Linear hits a webhook served by solto (via [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)).
3. solto creates a git worktree off `origin/main`, runs the agent headlessly against it, commits the diff, pushes the branch, opens a PR via [`gh`](https://cli.github.com/), and attaches that PR to the Linear issue.
4. If solto already opened a PR for that issue, a later Linear comment that starts with `@solto-bot` updates the same PR branch.
5. When the PR is merged, GitHub calls back into solto and the Linear issue moves to `Done`.
6. The Linear issue self-narrates through comments and workflow states.

### Coder

When `CODER=claude`, solto enables Claude subagents for research, implementation and review. If you set `CODER=auto`, solto prefers Claude for broader parallelizable work when `ANTHROPIC_API_KEY` is present and otherwise falls back to Codex.

### Kicking Off Work

An issue starts when it ends up both:

- Assigned to the bot user.
- In `Todo` / `To do`.

### Naming Commits and Branches

Commit and branch naming are driven by Linear labels:

- <kbd>type:feat</kbd>, <kbd>type:fix</kbd>, <kbd>type:docs</kbd>, <kbd>type:chore</kbd>, etc. set the conventional commit type solto uses.
- Bare labels like <kbd>feat</kbd>, <kbd>fix</kbd>, <kbd>docs</kbd> and <kbd>chore</kbd> also work.
- That type is used for both the branch name and the fallback commit message, for example `docs/MOBILE-123-update-readme` and `docs: Update README`.
- If no type label is present, solto defaults to <kbd>chore</kbd>.

### YOLO

Add the <kbd>yolo</kbd> label to push directly to `main` instead of opening a PR.

### Iterate on PRs via Linear Comments

For follow-up changes on an existing PR, comment with the bot mention, usually `@solto-bot`.

```text
@solto-bot address the review feedback about dependency versions and rerun lint
```

### Attachments

solto does its best to turn Linear attachments into useful agent context. Text-like attachments, embedded text and SVGs are passed through directly. Images are summarized when `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is configured and the provider can read them. Other binaries are treated as best-effort context and may be ignored if solto cannot extract anything useful from them.

## Trust Model

> [!WARNING]
> solto runs a coding agent with `--dangerously-skip-permissions` (Claude Code) / `--dangerously-bypass-approvals-and-sandbox` (Codex) on attacker-influenceable input. Treat assigning an issue to the bot user as **shell access to the host**.

## Requirements

- A Linux host with a dedicated `agent` user.
- [Node LTS](https://nodejs.org/), [pnpm](https://pnpm.io/), [pm2](https://pm2.keymetrics.io/), [git](https://git-scm.com/), [`gh`](https://cli.github.com/) and [`jq`](https://jqlang.org/).
- One coding agent CLI: [Codex](https://github.com/openai/codex) (default) or [Claude Code](https://docs.claude.com/en/docs/claude-code/overview).
- Public HTTPS to `localhost:3000` for Linear webhooks. The default setup uses [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/), but any HTTPS ingress works.
- A [Linear](https://linear.app/) workspace and a [GitHub](https://github.com/) account that can push branches and open PRs on your target repos.

Each managed target repo should live on GitHub, have a default branch and include its own root `AGENTS.md`. This is about the repo under `repos/<id>/`, not the `solto` repo itself.

## Running Multiple Projects

One `solto` instance can handle many repos and Linear projects under one GitHub identity. Add a project by updating `projects.local.json`, running `./scripts/add-project.sh <id>`, wiring the shared Linear `/linear-webhook`, wiring the repo’s GitHub `pull_request` webhook and restarting `solto`. `./scripts/add-project.sh` resolves the exact `linearProjectName` into a persisted `linearProjectId`, which solto uses as the hard repo/project binding.

Each project stays isolated:

- `repos/<id>/` holds the repo clone.
- `workers/<id>/` holds the active worktrees.
- `projects.local.json` controls concurrency and rate limits.
- `/status` shows each project independently.

For runtime checks:

```bash
curl -H "x-status-token: <STATUS_TOKEN>" https://<your-webhook-host>/status | jq
curl -H "x-status-token: <STATUS_TOKEN>" "https://<your-webhook-host>/status?include=logs" | jq
curl -H "x-status-token: <STATUS_TOKEN>" "https://<your-webhook-host>/status?include=logs&tail=5" | jq
```

`/status` includes live per-project activity, persisted recent jobs, bounded pm2 stats, `_version` and a response timestamp. Add `?include=logs` for a compact log tail and `tail=<n>` to control its size.

## FAQ

<details>
  <summary>Can one solto instance manage multiple repos and projects?</summary>

  Yes. One instance can manage many repo/project pairs as long as they all use the same GitHub identity on that host.
</details>

<details>
  <summary>How should I set up Linear webhooks for multiple projects?</summary>

  If several projects live under the same Linear team, they can share one team-level webhook pointing to `/linear-webhook`. If projects live under different Linear teams, create one Linear webhook per team, all pointing to the same `/linear-webhook` URL.
</details>

<details>
  <summary>How does solto know which repo a Linear ticket belongs to?</summary>

  Each `projects.local.json` entry starts with an exact `linearProjectName`. `./scripts/add-project.sh` resolves that to the real `linearProjectId` and writes it back into the file. At runtime, solto routes by that persisted `linearProjectId`.
</details>

<details>
  <summary>Can different repos on the same host use different GitHub users?</summary>

  No. One running `solto` instance assumes one GitHub identity for the whole host. If a repo needs a different GitHub user, run a separate `solto` instance on another host.
</details>

## License

ISC

<!-- <video src="https://github.com/user-attachments/assets/67de91de-d874-4b8d-9578-5d8cf5ff2d8a" muted playsinline></video> -->
