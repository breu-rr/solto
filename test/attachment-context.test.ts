import test from "node:test";
import assert from "node:assert/strict";

import {
  buildLinearAttachmentAuthHeader,
  buildAttachmentPromptBlock,
  isLikelyImageAttachment,
  isLikelyTextAttachment,
  sanitizeAttachmentFilename,
} from "../src/attachment-context.ts";

test("buildAttachmentPromptBlock includes local attachment paths and guardrails", () => {
  const block = buildAttachmentPromptBlock([
    {
      title: "Login Mockup",
      subtitle: "Latest revision",
      sourceType: "linear-attachment",
      url: "https://linear.app/example",
      localPath: "/tmp/worktree/.solto-attachments-abc/Login-Mockup.svg",
      note: "downloaded binary asset (image/svg+xml)",
    },
  ]);

  assert.match(block, /Attachments:/);
  assert.match(block, /Login Mockup/);
  assert.match(block, /local file: \/tmp\/worktree\/\.solto-attachments-abc\/Login-Mockup\.svg/);
  assert.match(block, /Do not modify or commit files under \.solto-attachments-\*/);
});

test("sanitizeAttachmentFilename strips unsafe characters", () => {
  assert.equal(
    sanitizeAttachmentFilename("../hero image?.svg"),
    "hero-image-.svg"
  );
});

test("isLikelyTextAttachment detects svg and structured text content", () => {
  assert.equal(isLikelyTextAttachment("https://example.com/mock.svg", null), true);
  assert.equal(isLikelyTextAttachment("https://example.com/data.bin", "application/json"), true);
  assert.equal(isLikelyTextAttachment("https://example.com/screenshot.png", "image/png"), false);
});

test("isLikelyImageAttachment detects common image types", () => {
  assert.equal(isLikelyImageAttachment("https://example.com/mock.png", null), true);
  assert.equal(isLikelyImageAttachment("https://example.com/mock.bin", "image/jpeg"), true);
  assert.equal(isLikelyImageAttachment("https://example.com/mock.svg", "image/svg+xml"), true);
  assert.equal(isLikelyImageAttachment("https://example.com/mock.pdf", "application/pdf"), false);
});

test("buildLinearAttachmentAuthHeader normalizes bearer auth", () => {
  assert.equal(buildLinearAttachmentAuthHeader(undefined), null);
  assert.equal(buildLinearAttachmentAuthHeader("abc123"), "Bearer abc123");
  assert.equal(buildLinearAttachmentAuthHeader("Bearer abc123"), "Bearer abc123");
});
