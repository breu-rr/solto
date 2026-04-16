const fs = require("node:fs");
const path = require("node:path");

const envPath = path.resolve(__dirname, ".env");
const fileEnv = {};

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) {
      continue;
    }

    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    fileEnv[match[1]] = value;
    process.env[match[1]] = value;
  }
}

const mergedEnv = { ...process.env, ...fileEnv };
const tunnelName = mergedEnv.TUNNEL_NAME || "solto-tunnel";

module.exports = {
  apps: [
    {
      name: "solto",
      script: "pnpm",
      args: "start",
      cwd: __dirname,
      env: mergedEnv,
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
    },
    {
      name: "cloudflare-tunnel",
      script: "cloudflared",
      args: `tunnel run ${tunnelName}`,
      env: mergedEnv,
      autorestart: true,
      max_restarts: 20,
      restart_delay: 2000,
      watch: false,
    },
  ],
};
