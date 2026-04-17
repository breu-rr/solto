import path from "node:path";

export interface AttachmentPromptEntry {
  title: string;
  url: string;
  subtitle?: string | null;
  sourceType?: string | null;
  localPath?: string | null;
  note?: string | null;
  summary?: string | null;
}

export function buildAttachmentPromptBlock(
  attachments: AttachmentPromptEntry[]
): string {
  if (!attachments.length) return "";

  const lines = attachments.flatMap((attachment) => {
    const parts = [
      `- ${attachment.title || "Attachment"}`,
      attachment.subtitle ? `subtitle: ${attachment.subtitle}` : null,
      attachment.sourceType ? `source: ${attachment.sourceType}` : null,
      attachment.localPath ? `local file: ${attachment.localPath}` : null,
      `original url: ${attachment.url}`,
      attachment.summary ? `summary: ${attachment.summary}` : null,
      attachment.note ? `note: ${attachment.note}` : null,
    ].filter(Boolean);
    return parts as string[];
  });

  return [
    "Attachments:",
    ...lines,
    "- Review relevant attachment files before making changes.",
    "- Do not modify or commit files under .solto-attachments-*; they are temporary task context.",
  ].join("\n");
}

export function sanitizeAttachmentFilename(input: string, fallback = "attachment"): string {
  const base = path.basename(input || fallback).trim() || fallback;
  const sanitized = base
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return sanitized || fallback;
}

export function isLikelyTextAttachment(
  url: string,
  contentType: string | null | undefined
): boolean {
  if (contentType) {
    const normalized = contentType.toLowerCase();
    if (
      normalized.startsWith("text/")
      || normalized.includes("json")
      || normalized.includes("xml")
      || normalized.includes("yaml")
      || normalized.includes("javascript")
      || normalized.includes("svg")
    ) {
      return true;
    }
  }

  const ext = path.extname(new URL(url).pathname).toLowerCase();
  return [
    ".svg",
    ".txt",
    ".md",
    ".markdown",
    ".json",
    ".yml",
    ".yaml",
    ".xml",
    ".csv",
    ".html",
    ".css",
    ".js",
    ".ts",
    ".tsx",
    ".jsx",
    ".mjs",
    ".cjs",
    ".py",
    ".sh",
  ].includes(ext);
}

export function isLikelyImageAttachment(
  url: string,
  contentType: string | null | undefined
): boolean {
  if (contentType?.toLowerCase().startsWith("image/")) return true;
  const ext = path.extname(new URL(url).pathname).toLowerCase();
  return [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"].includes(ext);
}

export function buildLinearAttachmentAuthHeader(
  token: string | undefined
): string | null {
  const trimmed = token?.trim();
  if (!trimmed) return null;
  if (/^bearer\s+/i.test(trimmed)) return trimmed;
  return `Bearer ${trimmed}`;
}
