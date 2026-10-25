import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  getPlanName,
  getSuggestionLimit,
  isSubscriber,
  visibleSuggestionCount,
} from "@/lib/plan";

describe("entitlements", () => {
  test("suggestion limits by lifetime purchases", () => {
    assert.equal(getSuggestionLimit(0), 3);
    assert.equal(getSuggestionLimit(null), 3);
    assert.equal(getSuggestionLimit(undefined), 3);
    assert.equal(getSuggestionLimit(1), 5);
    assert.equal(getSuggestionLimit(4), 5);
    assert.equal(getSuggestionLimit(5), 8);
    assert.equal(getSuggestionLimit(500), 8);
  });

  test("an active subscriber gets the top tier regardless of purchases", () => {
    assert.equal(getSuggestionLimit(0, true), 8);
    assert.equal(getPlanName(0, true), getPlanName(5));
  });

  test("never shows more suggestions than exist", () => {
    assert.equal(visibleSuggestionCount(2, 5), 2);
    assert.equal(visibleSuggestionCount(20, 0), 3);
  });

  test("ONLY the exact status 'active' grants subscriber access", () => {
    assert.equal(isSubscriber({ subscription_status: "active" }), true);
    for (const status of [
      "cancelled",
      "expired",
      "on_hold",
      "ACTIVE",
      "Active",
      "active ",
      "",
      null,
      undefined,
    ]) {
      assert.equal(
        isSubscriber({ subscription_status: status }),
        false,
        String(status)
      );
    }
    assert.equal(isSubscriber(null), false);
    assert.equal(isSubscriber(undefined), false);
    assert.equal(isSubscriber({}), false);
  });
});
