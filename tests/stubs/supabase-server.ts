/**
 * Test double for the cookie-based Supabase session client, used ONLY by the
 * route tests (tests/tsconfig.stubs.json swaps it in for
 * "@/lib/supabase/server"). It lets route handlers run with no network and
 * no database, with the signed-in user and a few table rows controlled by the
 * test through globalThis.__TEST.
 */
export interface TestState {
  user: { id: string } | null;
  subscriptionStatus: string | null;
  /** When false, check_rate_limit() answers "not allowed". */
  limiterAllows: boolean;
  /** When true, table queries throw (to exercise a route's error handling). */
  failQueries: boolean;
  /** Fake result for auth.exchangeCodeForSession. */
  exchange: {
    user: { created_at: string; last_sign_in_at: string } | null;
    error: unknown;
  };
}

const g = globalThis as unknown as { __TEST?: TestState };

export function testState(): TestState {
  g.__TEST ??= {
    user: null,
    subscriptionStatus: null,
    limiterAllows: true,
    failQueries: false,
    exchange: {
      user: {
        created_at: "2026-01-01T00:00:00Z",
        last_sign_in_at: "2026-06-01T00:00:00Z",
      },
      error: null,
    },
  };
  return g.__TEST;
}

function thenable(data: unknown) {
  const promise = Promise.resolve({ data, error: null });
  return Object.assign(promise, { single: () => promise });
}

export async function createServerSupabaseClient() {
  const state = testState();
  return {
    auth: {
      getUser: async () => ({ data: { user: state.user } }),
      exchangeCodeForSession: async () => ({
        data: { user: state.exchange.user },
        error: state.exchange.error,
      }),
    },
    rpc: () =>
      thenable(
        state.limiterAllows
          ? { allowed: true, retry_after_seconds: 0 }
          : { allowed: false, retry_after_seconds: 42 }
      ),
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => {
            if (state.failQueries)
              throw new Error(
                "connect ECONNREFUSED 10.0.0.5:5432 password=hunter2"
              );
            return {
              data: { subscription_status: state.subscriptionStatus },
              error: null,
            };
          },
        }),
      }),
    }),
  };
}
