import { execSilent } from "./exec.js";
import type { ProjectConfig } from "./projects.js";
import { getJobState } from "./run-state.js";

export type WorkspaceCleanupResult = "cleaned" | "skipped_running";

export async function cleanupIssueWorkspace(
  project: ProjectConfig,
  issueId: string,
  branch: string
): Promise<WorkspaceCleanupResult> {
  const job = await getJobState(issueId).catch(() => null);
  if (job?.status === "running") {
    return "skipped_running";
  }

  const worktree = `${project.workersPath}/${issueId}`;

  await execSilent("git", [
    "-C", project.repoPath,
    "worktree", "remove", worktree, "--force",
  ]);
  await execSilent("git", [
    "-C", project.repoPath,
    "worktree", "prune",
  ]);
  await execSilent("git", [
    "-C", project.repoPath,
    "branch", "-D", branch,
  ]);

  return "cleaned";
}
