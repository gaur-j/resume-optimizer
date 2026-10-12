-- ============================================================
-- OPTIONAL one-off cleanup (not required for the code fix to work).
--
-- Before this fix, /api/analyze stored EVERY AI-generated bullet rewrite in
-- scans.result_json, and users can read their own scans rows directly through
-- the Supabase API. The code now stores only the rewrites the user's plan
-- shows, but rows written earlier still contain the full list.
--
-- This trims old rows down to the first 3 rewrites (the free-tier amount).
-- Nothing in the app reads old scans back, so nobody loses anything visible;
-- it only removes the copy a free user could have pulled from the API.
-- Safe to re-run. Run the SELECT first to see how many rows it will touch.
-- ============================================================

-- 1) Preview: how many rows currently hold more than 3 stored rewrites?
 SELECT count(*) FROM public.scans
 WHERE CASE WHEN jsonb_typeof(result_json->'bullet_rewrites') = 'array'
            THEN jsonb_array_length(result_json->'bullet_rewrites') > 3
            ELSE FALSE END;

-- 2) Trim (remember the original count so the stat isn't lost):
UPDATE public.scans
SET result_json = jsonb_set(
      jsonb_set(
        result_json,
        '{total_suggestions_available}',
        COALESCE(result_json->'total_suggestions_available',
                 to_jsonb(jsonb_array_length(result_json->'bullet_rewrites')))
      ),
      '{bullet_rewrites}',
      (SELECT COALESCE(jsonb_agg(elem ORDER BY idx), '[]'::jsonb)
         FROM jsonb_array_elements(result_json->'bullet_rewrites')
              WITH ORDINALITY AS t(elem, idx)
        WHERE idx <= 3)
    )
-- CASE (not AND): Postgres does not guarantee AND short-circuits, and
-- jsonb_array_length() raises an error on rows where bullet_rewrites is null
-- or not an array. CASE does guarantee the order of evaluation.
WHERE CASE
        WHEN jsonb_typeof(result_json->'bullet_rewrites') = 'array'
        THEN jsonb_array_length(result_json->'bullet_rewrites') > 3
        ELSE FALSE
      END;