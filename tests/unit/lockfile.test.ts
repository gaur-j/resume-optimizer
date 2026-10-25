import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * Guards the exact failures that have broken deploys here: a single mistyped
 * character in package-lock.json ("ssha512-" for "sha512-") made every
 * install fail, and a package.json edited without the lockfile made
 * `npm ci` fail. Catching them in seconds beats finding out from a red deploy.
 */
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));

describe("package-lock.json", () => {
  test("every integrity hash is well-formed", () => {
    const valid = /^(sha1|sha256|sha384|sha512)-[A-Za-z0-9+/]+={0,2}$/;
    const bad: string[] = [];
    for (const [name, entry] of Object.entries<{ integrity?: string }>(
      lock.packages
    )) {
      if (!entry.integrity) continue;
      if (!entry.integrity.split(" ").every((part) => valid.test(part))) {
        bad.push(`${name}: ${entry.integrity.slice(0, 24)}...`);
      }
    }
    assert.deepEqual(bad, []);
  });

  test("lockfile and package.json agree on direct dependencies", () => {
    const root = lock.packages[""];
    for (const field of ["dependencies", "devDependencies"] as const) {
      assert.deepEqual(
        Object.entries(root[field] ?? {}).sort(),
        Object.entries(pkg[field] ?? {}).sort(),
        `${field} differ between package.json and package-lock.json (run npm install)`
      );
    }
  });

  test("every direct dependency is actually locked", () => {
    for (const name of [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ]) {
      assert.ok(
        lock.packages[`node_modules/${name}`],
        `${name} is missing from package-lock.json`
      );
    }
  });

  test("build-time CLIs are not production dependencies", () => {
    assert.equal(
      pkg.dependencies?.shadcn,
      undefined,
      "shadcn is a CLI; keep it in devDependencies"
    );
    assert.equal(pkg.dependencies?.tsx, undefined);
  });

  test("package.json has no stray placeholder keys", () => {
    assert.equal("..." in pkg, false);
  });
});
