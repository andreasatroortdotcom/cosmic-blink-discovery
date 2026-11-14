CREATE TABLE public.patch_rulings (
  patch_id text PRIMARY KEY,
  ruling text NOT NULL CHECK (ruling IN ('confirmed','rejected')),
  ruled_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.patch_rulings TO anon, authenticated;
GRANT ALL ON public.patch_rulings TO service_role;
ALTER TABLE public.patch_rulings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rulings are public" ON public.patch_rulings FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE VIEW public.patch_verification WITH (security_invoker = true) AS
WITH first AS (
  SELECT DISTINCT ON (patch_id) patch_id, user_id, user_session_id, created_at, ra, dec, constellation
  FROM public.swipes WHERE verdict = 'candidate' ORDER BY patch_id, created_at
), votes AS (
  SELECT f.patch_id,
    count(*) FILTER (WHERE s.verdict = 'candidate') AS yes,
    count(*) FILTER (WHERE s.verdict = 'static') AS no
  FROM first f JOIN public.swipes s ON s.patch_id = f.patch_id
   AND s.created_at > f.created_at AND s.user_session_id <> f.user_session_id
   AND (f.user_id IS NULL OR s.user_id IS NULL OR s.user_id <> f.user_id)
   AND s.verdict IN ('candidate', 'static')
  GROUP BY f.patch_id
)
SELECT f.patch_id, f.ra, f.dec, f.constellation, f.user_id AS discoverer_id, f.created_at AS flagged_at,
  coalesce(v.yes, 0)::int AS yes_votes, coalesce(v.no, 0)::int AS no_votes,
  CASE WHEN r.ruling IS NOT NULL THEN r.ruling
       WHEN coalesce(v.yes, 0) + coalesce(v.no, 0) < 10 THEN 'pending'
       WHEN v.yes >= 0.7 * (v.yes + v.no) THEN 'confirmed'
       ELSE 'second_review' END AS status
FROM first f LEFT JOIN votes v USING (patch_id) LEFT JOIN public.patch_rulings r USING (patch_id);

CREATE OR REPLACE VIEW public.leaderboard WITH (security_invoker = true) AS
WITH pv AS (SELECT * FROM public.patch_verification),
per AS (
  SELECT s.user_id,
    count(*) AS reviews,
    count(*) FILTER (WHERE pv.patch_id IS NOT NULL AND s.created_at > pv.flagged_at AND s.verdict IN ('candidate','static')) AS verifications,
    count(*) FILTER (WHERE pv.patch_id IS NOT NULL AND s.created_at > pv.flagged_at AND (
      (pv.status = 'confirmed' AND s.verdict = 'candidate') OR (pv.status IN ('second_review','rejected') AND s.verdict = 'static'))) AS correct
  FROM public.swipes s LEFT JOIN pv ON pv.patch_id = s.patch_id
  WHERE s.user_id IS NOT NULL GROUP BY s.user_id
), disc AS (
  SELECT discoverer_id AS user_id, count(*) AS first_flags, count(*) FILTER (WHERE status = 'confirmed') AS confirmed
  FROM pv WHERE discoverer_id IS NOT NULL GROUP BY discoverer_id
)
SELECT p.user_id, pr.display_name, pr.avatar_url,
  p.reviews::int, p.verifications::int,
  coalesce(d.first_flags, 0)::int AS first_flags, coalesce(d.confirmed, 0)::int AS confirmed,
  (p.reviews + 5 * p.verifications + 5 * p.correct + 10 * coalesce(d.first_flags, 0) + 100 * coalesce(d.confirmed, 0))::int AS points,
  p.correct::int AS correct_verifications
FROM per p LEFT JOIN disc d USING (user_id) LEFT JOIN public.profiles pr ON pr.id = p.user_id;

CREATE OR REPLACE FUNCTION public.claim_guest_swipes(_session text)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  -- A browser session can only ever be claimed by one account.
  IF EXISTS (SELECT 1 FROM swipes WHERE user_session_id = _session AND user_id IS NOT NULL AND user_id <> auth.uid()) THEN RETURN 0; END IF;
  UPDATE swipes s SET user_id = auth.uid()
  WHERE s.user_session_id = _session AND s.user_id IS NULL
    AND NOT EXISTS (SELECT 1 FROM swipes o WHERE o.user_id = auth.uid() AND o.patch_id = s.patch_id);
  GET DIAGNOSTICS n = ROW_COUNT; RETURN n;
END $$;
REVOKE EXECUTE ON FUNCTION public.claim_guest_swipes(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_guest_swipes(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rule_patch(_patch text, _ruling text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF _ruling NOT IN ('confirmed','rejected') THEN RAISE EXCEPTION 'BAD_RULING'; END IF;
  IF coalesce((SELECT points FROM leaderboard WHERE user_id = auth.uid()), 0) < 800 THEN RAISE EXCEPTION 'TITLE_REQUIRED'; END IF;
  IF NOT EXISTS (SELECT 1 FROM patch_verification WHERE patch_id = _patch AND status = 'second_review') THEN RAISE EXCEPTION 'NOT_IN_REVIEW'; END IF;
  IF EXISTS (SELECT 1 FROM patch_verification WHERE patch_id = _patch AND discoverer_id = auth.uid()) THEN RAISE EXCEPTION 'OWN_FLAG'; END IF;
  INSERT INTO patch_rulings (patch_id, ruling, ruled_by) VALUES (_patch, _ruling, auth.uid());
END $$;
REVOKE EXECUTE ON FUNCTION public.rule_patch(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rule_patch(text, text) TO authenticated;