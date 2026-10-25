#!/usr/bin/env bash
# Many requests crediting the SAME payment at once (the browser's
# verify-payment call, Razorpay's webhook, retries, a replayed signature).
# Exactly one may grant credits.
set -euo pipefail

PSQL=(psql -X -w -At -v ON_ERROR_STOP=1)
USER_ID='33333333-3333-3333-3333-333333333333'
N=25

"${PSQL[@]}" -q <<SQL
INSERT INTO auth.users VALUES ('$USER_ID', 'race@example.com') ON CONFLICT DO NOTHING;
DELETE FROM payments WHERE razorpay_order_id = 'order_RACE';
INSERT INTO payments (user_id, razorpay_order_id, amount_inr, scan_credits_granted, status)
VALUES ('$USER_ID', 'order_RACE', 249, 5, 'pending');
SQL

before=$("${PSQL[@]}" -c "SELECT scan_credits FROM users WHERE id = '$USER_ID'")
out=$(mktemp -d)

for i in $(seq "$N"); do
  "${PSQL[@]}" -c "SET ROLE service_role; SELECT outcome FROM grant_credits_for_order('order_RACE', 'pay_RACE', 'sig_RACE');" \
    > "$out/$i.txt" 2>&1 &
done
wait

granted=$(cat "$out"/*.txt | grep -c '^granted$' || true)
processed=$(cat "$out"/*.txt | grep -c '^already_processed$' || true)
after=$("${PSQL[@]}" -c "SELECT scan_credits FROM users WHERE id = '$USER_ID'")
rm -rf "$out"

echo "race: $N concurrent grants -> granted=$granted already_processed=$processed credits $before -> $after"

[ "$granted" -eq 1 ]            || { echo "FAIL  expected exactly 1 grant, got $granted"; exit 1; }
[ "$processed" -eq $((N - 1)) ] || { echo "FAIL  expected $((N - 1)) no-ops, got $processed"; exit 1; }
[ "$after" -eq $((before + 5)) ] || { echo "FAIL  credits must rise by exactly 5"; exit 1; }
echo "PASS  concurrent payment crediting is exactly-once"
