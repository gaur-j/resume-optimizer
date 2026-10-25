// Runs the test suites with Node's built-in test runner. `tsx` is only the
// bridge that lets Node run TypeScript with this project's "@/..." aliases.
//
//   unit   - pure logic, real modules, no network, no database
//   routes - real route handlers with the Supabase session / rate-limit
//            modules swapped for in-memory test doubles (tests/stubs)
//
// Database (row-level-security) tests need Postgres: see tests/db/run.sh.
import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const tsx = join("node_modules", "tsx", "dist", "cli.mjs");

function findTests(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return findTests(path);
    return path.endsWith(".test.ts") ? [path] : [];
  });
}

// Harmless placeholders so modules that read env at import time don't throw.
const testEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:1",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role",
  RAZORPAY_SECRET: "test_api_secret",
  RAZORPAY_WEBHOOK_SECRET: "test_webhook_secret",
  NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_x",
  ERROR_WEBHOOK_URL: "",
};

// The tests need Node 20+ (node:test, global fetch/FormData/ReadableStream).
const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor < 20) {
  console.error(
    `These tests need Node 20 or newer; this is Node ${process.version}.`
  );
  process.exit(1);
}

// VS Code's "JavaScript Debug Terminal" attaches a debugger to EVERY Node
// process through NODE_OPTIONS. For a test run that only adds noise
// ("Debugger attached", "inspector forces a concurrency of 1") and changes
// timing, so those hooks are removed from the environment passed to the tests.
// Any other NODE_OPTIONS you set (e.g. --max-old-space-size) are kept.
export function withoutDebuggerHooks(env) {
  const clean = { ...env };
  if (clean.NODE_OPTIONS) {
    clean.NODE_OPTIONS = clean.NODE_OPTIONS.replace(
      /--require\s+(?:"[^"]*js-debug[^"]*"|'[^']*js-debug[^']*'|\S*js-debug\S*)/gi,
      ""
    ).trim();
    if (!clean.NODE_OPTIONS) delete clean.NODE_OPTIONS;
  }
  delete clean.VSCODE_INSPECTOR_OPTIONS;
  return clean;
}

console.log(`Node ${process.version}`);

const suites = [
  { name: "unit", files: findTests("tests/unit"), env: {} },
  {
    name: "routes",
    files: findTests("tests/routes"),
    env: { TSX_TSCONFIG_PATH: "tests/tsconfig.stubs.json" },
  },
];

const only = process.argv[2]; // optional: "unit" | "routes"
let failed = false;

for (const suite of suites) {
  if (only && suite.name !== only) continue;
  if (suite.files.length === 0) continue;

  console.log(`\n=== ${suite.name} (${suite.files.length} files) ===`);
  const result = spawnSync(process.execPath, [tsx, "--test", ...suite.files], {
    stdio: "inherit",
    env: { ...withoutDebuggerHooks(process.env), ...testEnv, ...suite.env },
  });
  if (result.status !== 0) failed = true;
}

process.exit(failed ? 1 : 0);
