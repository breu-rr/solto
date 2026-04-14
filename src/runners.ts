import { exec } from "./exec.js";

export type Coder = "claude" | "codex";

const AGENT_TIMEOUT_MS = Number(process.env.AGENT_TIMEOUT_MS ?? 20 * 60 * 1000);
const CLAUDE_SUBAGENTS_ENABLED = !["0", "false", "no"].includes(
  (process.env.CLAUDE_ENABLE_SUBAGENTS ?? "1").toLowerCase()
);

const CLAUDE_SUBAGENTS = {
  researcher: {
    description:
      "Research specialist. Use proactively for background reading, repo exploration, and parallel fact-finding on independent questions.",
    prompt:
      "You are a focused research subagent. Explore only what is needed, summarize findings clearly, and hand back concise evidence the main agent can use immediately.",
    tools: ["Read", "Grep", "Glob", "Bash"],
    model: "inherit",
  },
  implementer: {
    description:
      "Implementation specialist. Use proactively for isolated, clearly bounded code changes in specific files or modules.",
    prompt:
      "You are a focused implementation subagent. Make the smallest coherent change for the assigned slice, verify it when practical, and report exactly what changed.",
    tools: ["Read", "Write", "Edit", "Grep", "Glob", "Bash"],
    model: "inherit",
  },
  reviewer: {
    description:
      "Code review specialist. Use proactively after code changes to spot regressions, missing tests, and risky assumptions.",
    prompt:
      "You are a focused reviewer subagent. Review the diff for correctness, regressions, and testing gaps, then return concise, prioritized findings.",
    tools: ["Read", "Grep", "Glob", "Bash"],
    model: "inherit",
  },
} as const;

export function getCoder(): Coder {
  const v = (process.env.CODER ?? "codex").toLowerCase();
  if (v !== "claude" && v !== "codex") {
    throw new Error(`Unknown CODER: ${v} (expected "claude" or "codex")`);
  }
  return v;
}

export async function runCoder(
  prompt: string,
  cwd: string
): Promise<Coder> {
  const coder = getCoder();
  if (coder === "codex") await runCodex(prompt, cwd);
  else await runClaude(prompt, cwd);
  return coder;
}

export const CODER_DISPLAY_NAMES: Record<Coder, string> = {
  claude: "Claude Code",
  codex: "Codex",
};

// Coders run headlessly with --dangerously-skip-permissions / --dangerously-bypass-approvals-and-sandbox
// on Linear-issue content (attacker-influenceable if someone can add the `agent` label).
// Restrict their env so a prompt-injected agent cannot read other projects' webhook secrets,
// LINEAR_API_KEY, STATUS_TOKEN, or unrelated host state.
function baseEnv(): NodeJS.ProcessEnv {
  const { PATH, HOME, USER, LANG, LC_ALL, TERM, TZ } = process.env;
  return { PATH, HOME, USER, LANG, LC_ALL, TERM, TZ };
}

async function runClaude(prompt: string, cwd: string): Promise<void> {
  const env = baseEnv();
  if (process.env.ANTHROPIC_API_KEY) {
    env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  }
  const args = [
    "--dangerously-skip-permissions",
    "--model", "claude-sonnet-4-5",
    "--max-turns", "30",
  ];
  if (CLAUDE_SUBAGENTS_ENABLED) {
    args.push("--agents", JSON.stringify(CLAUDE_SUBAGENTS));
  }
  args.push("-p", prompt);
  await exec(
    "claude",
    args,
    { cwd, env, timeoutMs: AGENT_TIMEOUT_MS }
  );
}

async function runCodex(prompt: string, cwd: string): Promise<void> {
  // Empty OPENAI_API_KEY must be unset so Codex falls back to `codex login`
  // credentials (ChatGPT subscription). Setting it to "" defeats the fallback.
  const env = baseEnv();
  if (process.env.OPENAI_API_KEY) {
    env.OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  }
  await exec(
    "codex",
    [
      "exec",
      "--dangerously-bypass-approvals-and-sandbox",
      prompt,
    ],
    { cwd, env, timeoutMs: AGENT_TIMEOUT_MS }
  );
}
