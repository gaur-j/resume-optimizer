// Runs tests/diagnose/public-route.diag.ts with the same environment as `npm test`.
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const env = { ...process.env };
if (env.NODE_OPTIONS) {
  env.NODE_OPTIONS = env.NODE_OPTIONS.replace(/--require\s+(?:"[^"]*js-debug[^"]*"|'[^']*js-debug[^']*'|\S*js-debug\S*)/gi, "").trim();
  if (!env.NODE_OPTIONS) delete env.NODE_OPTIONS;
}
delete env.VSCODE_INSPECTOR_OPTIONS;

const result = spawnSync(
  process.execPath,
  [join("node_modules", "tsx", "dist", "cli.mjs"), join("tests", "diagnose", "public-route.diag.ts")],
  {
    stdio: "inherit",
    env: {
      ...env,
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:1",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role",
      ERROR_WEBHOOK_URL: "",
      TSX_TSCONFIG_PATH: "tests/tsconfig.stubs.json",
    },
  }
);
process.exit(result.status ?? 1);
