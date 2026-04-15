import test from "node:test";
import assert from "node:assert/strict";

import { redactSecrets } from "../src/redact.ts";

test("redactSecrets hides known token formats", () => {
  const input = [
    "ghp_abcdefghijklmnopqrstuvwxyz123456",
    "lin_api_abcdefghijklmnopqrstuvwxyz",
    "sk-ant-api03-secret-value",
    "Bearer super-secret-token-value",
  ].join("\n");

  const output = redactSecrets(input);

  assert.equal(output.includes("ghp_"), false);
  assert.equal(output.includes("lin_api_"), false);
  assert.equal(output.includes("sk-ant-"), false);
  assert.equal(output.includes("Bearer super-secret-token-value"), false);
  assert.match(output, /\[redacted\]/);
});

test("redactSecrets hides configured env values even without a known prefix", () => {
  const original = process.env.STATUS_TOKEN;
  process.env.STATUS_TOKEN = "plain-secret-value";

  try {
    const output = redactSecrets("status token leaked: plain-secret-value");
    assert.equal(output.includes("plain-secret-value"), false);
    assert.match(output, /\[redacted\]/);
  } finally {
    if (original === undefined) delete process.env.STATUS_TOKEN;
    else process.env.STATUS_TOKEN = original;
  }
});
