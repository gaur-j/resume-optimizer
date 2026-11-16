import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import rolesData from "@/data/ats-roles.json";
import industriesData from "@/data/industries-keywords.json";
import nextConfig from "../../next.config";
import sitemap from "@/app/sitemap";
import {
  SECTOR_SLUGS,
  industryHref,
  isSectorSlug,
  roleSlugForIndustry,
} from "@/lib/seo-routes";

// Next.js matches redirects with this exact library and these options.
const require = createRequire(import.meta.url);
const { pathToRegexp, compile } = require("next/dist/compiled/path-to-regexp");

type Redirect = { source: string; destination: string; permanent: boolean };

const roleSlugs = new Set((rolesData as { slug: string }[]).map((r) => r.slug));
const industrySlugs = (industriesData as { slug: string }[]).map((i) => i.slug);
const roleEntries = industrySlugs.filter((s) => !isSectorSlug(s));

/** Follow redirects the way Next does: first matching rule wins. */
async function followOnce(path: string, rules: Redirect[]) {
  for (const rule of rules) {
    const keys: unknown[] = [];
    const re = pathToRegexp(rule.source, keys, {
      strict: true,
      sensitive: false,
      delimiter: "/",
    });
    const m = re.exec(path);
    if (!m) continue;
    const params: Record<string, string> = {};
    (keys as { name: string | number }[]).forEach((k, i) => {
      params[String(k.name)] = m[i + 1];
    });
    return {
      to: compile(rule.destination, { validate: false })(params) as string,
      permanent: rule.permanent,
    };
  }
  return null;
}

async function getRules(): Promise<Redirect[]> {
  return (await nextConfig.redirects!()) as Redirect[];
}

describe("industry data rules", () => {
  test("23 sectors, all present in the data and none is a job role", () => {
    assert.equal(SECTOR_SLUGS.length, 23);
    assert.equal(new Set(SECTOR_SLUGS).size, 23);
    for (const slug of SECTOR_SLUGS) {
      assert.ok(
        industrySlugs.includes(slug),
        `sector missing in data: ${slug}`
      );
      assert.ok(!roleSlugs.has(slug), `sector is also a role slug: ${slug}`);
    }
  });

  test("every other entry maps to a real role page, with no collisions", () => {
    assert.equal(roleEntries.length, 259);
    const targets = roleEntries.map(roleSlugForIndustry);
    for (const t of targets) assert.ok(roleSlugs.has(t), `no role page: ${t}`);
    assert.equal(
      new Set(targets).size,
      targets.length,
      "two entries share a role"
    );
  });

  test("industry slugs are unique and lowercase-safe", () => {
    assert.equal(new Set(industrySlugs).size, industrySlugs.length);
    for (const s of SECTOR_SLUGS) assert.match(s, /^[a-z0-9-]+$/);
  });

  test("industryHref sends sectors to their page and roles to the role page", () => {
    assert.equal(industryHref("technology"), "/resume-keyword/technology");
    assert.equal(
      industryHref("devops-engineer"),
      "/ats-resume/devops-engineer"
    );
    assert.equal(industryHref("SWE"), "/ats-resume/software-engineer");
  });
});

describe("redirects (simulated with Next's own matcher)", () => {
  test("every old role-entry URL reaches its role page in ONE hop", async () => {
    const rules = await getRules();
    for (const prefix of [
      "/resume-keyword",
      "/resume-keyword-checker",
      "/resume-keywords",
    ]) {
      for (const slug of roleEntries) {
        const hop = await followOnce(`${prefix}/${slug}`, rules);
        const want = `/ats-resume/${roleSlugForIndustry(slug)}`;
        assert.ok(hop, `no redirect for ${prefix}/${slug}`);
        assert.equal(hop.to, want, `${prefix}/${slug}`);
        assert.equal(hop.permanent, true);
        // The target must be a final page, not another redirect.
        assert.equal(
          await followOnce(hop.to, rules),
          null,
          `chain at ${hop.to}`
        );
      }
    }
  });

  test("no redirect source is too long for Next.js (limit 4096)", async () => {
    // A real `next build` fails with "Invalid redirects" above this limit.
    for (const rule of await getRules()) {
      const regex = pathToRegexp(rule.source, [], {
        strict: true,
        sensitive: false,
        delimiter: "/",
      }) as RegExp;
      assert.ok(
        regex.source.length < 4096,
        `redirect too long (${regex.source.length}): ${rule.source.slice(
          0,
          60
        )}`
      );
    }
  });

  test("real sector URLs are NOT redirected to a role page", async () => {
    const rules = await getRules();
    for (const slug of SECTOR_SLUGS) {
      assert.equal(await followOnce(`/resume-keyword/${slug}`, rules), null);
    }
  });

  test("older sector URLs still take a single hop to the sector page", async () => {
    const rules = await getRules();
    for (const slug of SECTOR_SLUGS) {
      for (const prefix of ["/resume-keyword-checker", "/resume-keywords"]) {
        const hop = await followOnce(`${prefix}/${slug}`, rules);
        assert.equal(hop?.to, `/resume-keyword/${slug}`);
        assert.equal(await followOnce(hop!.to, rules), null);
      }
    }
  });

  test("a slug that merely starts like a role slug is not caught", async () => {
    const rules = await getRules();
    const hop = await followOnce("/resume-keyword/devops-engineer-lead", rules);
    assert.equal(hop, null);
  });

  test("the wrongly cased SWE URL is redirected", async () => {
    const hop = await followOnce("/resume-keyword/SWE", await getRules());
    assert.equal(hop?.to, "/ats-resume/software-engineer");
  });
});

describe("sitemap", () => {
  const urls = sitemap();
  const list = urls.map((u) => u.url);

  test("lists each role page once and only the real sectors under /resume-keyword", () => {
    const kw = list.filter((u) => /\/resume-keyword\/[^/]+$/.test(u));
    assert.equal(kw.length, SECTOR_SLUGS.length);
    for (const u of kw) {
      assert.ok(
        isSectorSlug(u.split("/").pop()!),
        `non-sector in sitemap: ${u}`
      );
    }
    const roles = list.filter((u) => u.includes("/ats-resume/"));
    assert.equal(roles.length, roleSlugs.size);
    assert.equal(new Set(list).size, list.length, "duplicate URLs");
  });

  test("no redirected URL is in the sitemap", async () => {
    const rules = await getRules();
    for (const u of list) {
      const path = new URL(u).pathname;
      assert.equal(await followOnce(path, rules), null, `redirected: ${path}`);
    }
  });

  test("lastModified is a fixed date, not the build time", () => {
    const times = new Set(urls.map((u) => (u.lastModified as Date).getTime()));
    assert.equal(times.size, 1);
    assert.ok([...times][0] < Date.now() - 1000);
  });
});
