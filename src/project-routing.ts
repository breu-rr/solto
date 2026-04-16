export function issueBelongsToProject(
  project: { linearProjectId: string },
  issueProjectId: string | null | undefined
): boolean {
  return Boolean(issueProjectId) && issueProjectId === project.linearProjectId;
}
