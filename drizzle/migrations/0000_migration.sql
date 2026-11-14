CREATE TABLE public.swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patch_id text NOT NULL CHECK (char_length(patch_id) BETWEEN 1 AND 100),
  ra double precision NOT NULL CHECK (ra >= 0 AND ra < 360),
  dec double precision NOT NULL CHECK (dec >= -90 AND dec <= 90),
  constellation text NOT NULL DEFAULT '' CHECK (char_length(constellation) <= 60),
  verdict text NOT NULL CHECK (verdict IN ('candidate','static','skipped')),
  candidate_type text CHECK (candidate_type IN ('planet_x','brown_dwarf','asteroid_comet','variable_star','unknown')),
  user_session_id text NOT NULL CHECK (char_length(user_session_id) BETWEEN 8 AND 64),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((verdict = 'candidate') = (candidate_type IS NOT NULL))
);
GRANT SELECT, INSERT ON public.swipes TO anon, authenticated;
GRANT ALL ON public.swipes TO service_role;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read swipes" ON public.swipes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can record swipes" ON public.swipes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE INDEX swipes_created_at_idx ON public.swipes (created_at DESC);
CREATE INDEX swipes_patch_idx ON public.swipes (patch_id);

CREATE OR REPLACE VIEW public.swipe_stats WITH (security_invoker = true) AS
SELECT count(*)::int AS total_swipes,
       count(DISTINCT patch_id)::int AS patches_inspected,
       count(*) FILTER (WHERE verdict = 'candidate')::int AS anomalies_flagged,
       count(DISTINCT user_session_id)::int AS volunteers
FROM public.swipes;
CREATE OR REPLACE VIEW public.candidate_patches WITH (security_invoker = true) AS
SELECT patch_id, avg(ra) AS ra, avg(dec) AS dec, max(constellation) AS constellation,
       count(*) FILTER (WHERE verdict = 'candidate')::int AS flags,
       count(DISTINCT user_session_id) FILTER (WHERE verdict = 'candidate')::int AS flaggers,
       count(*) FILTER (WHERE verdict = 'static')::int AS static_votes,
       mode() WITHIN GROUP (ORDER BY candidate_type) AS top_type,
       max(created_at) AS last_at
FROM public.swipes GROUP BY patch_id
HAVING count(*) FILTER (WHERE verdict = 'candidate') > 0;
GRANT SELECT ON public.swipe_stats, public.candidate_patches TO anon, authenticated;