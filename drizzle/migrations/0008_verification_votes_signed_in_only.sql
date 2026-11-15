CREATE OR REPLACE VIEW public.patch_verification WITH (security_invoker = false) AS
WITH first AS (
  SELECT DISTINCT ON (swipes.patch_id) swipes.patch_id, swipes.user_id, swipes.user_session_id, swipes.created_at, swipes.ra, swipes."dec", swipes.constellation
  FROM public.swipes WHERE swipes.verdict = 'candidate'
  ORDER BY swipes.patch_id, swipes.created_at
), votes AS (
  SELECT f_1.patch_id,
    count(DISTINCT s.user_id) FILTER (WHERE s.verdict = 'candidate') AS yes,
    count(DISTINCT s.user_id) FILTER (WHERE s.verdict = 'static') AS no
  FROM first f_1
  JOIN public.swipes s ON s.patch_id = f_1.patch_id AND s.created_at > f_1.created_at
    AND s.user_id IS NOT NULL
    AND s.user_session_id <> f_1.user_session_id
    AND (f_1.user_id IS NULL OR s.user_id <> f_1.user_id)
    AND s.verdict IN ('candidate','static')
  GROUP BY f_1.patch_id
)
SELECT f.patch_id, f.ra, f."dec", f.constellation, f.user_id AS discoverer_id, f.created_at AS flagged_at,
  COALESCE(v.yes, 0)::integer AS yes_votes, COALESCE(v.no, 0)::integer AS no_votes,
  CASE WHEN r.ruling IS NOT NULL THEN r.ruling
       WHEN COALESCE(v.yes,0) + COALESCE(v.no,0) < 10 THEN 'pending'
       WHEN v.yes::numeric >= 0.7 * (v.yes + v.no)::numeric THEN 'confirmed'
       ELSE 'second_review' END AS status
FROM first f LEFT JOIN votes v USING (patch_id) LEFT JOIN public.patch_rulings r USING (patch_id);
GRANT SELECT ON public.patch_verification TO anon, authenticated;