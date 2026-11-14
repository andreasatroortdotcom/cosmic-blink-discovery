CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Volunteer',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT UPDATE (display_name) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are public" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Edit own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id,
    left(coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Volunteer'), 60),
    NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_profile() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

ALTER TABLE public.swipes ADD COLUMN user_id uuid;
GRANT SELECT (user_id) ON public.swipes TO anon, authenticated;
CREATE UNIQUE INDEX swipes_one_vote_per_user ON public.swipes (user_id, patch_id) WHERE user_id IS NOT NULL;
CREATE INDEX swipes_patch_time_idx ON public.swipes (patch_id, created_at);

CREATE OR REPLACE FUNCTION public.set_swipe_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.set_swipe_user() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER swipes_set_user BEFORE INSERT ON public.swipes FOR EACH ROW EXECUTE FUNCTION public.set_swipe_user();

CREATE VIEW public.patch_verification WITH (security_invoker = true) AS
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
  CASE WHEN coalesce(v.yes, 0) + coalesce(v.no, 0) < 10 THEN 'pending'
       WHEN v.yes >= 0.7 * (v.yes + v.no) THEN 'confirmed'
       ELSE 'second_review' END AS status
FROM first f LEFT JOIN votes v USING (patch_id);
GRANT SELECT ON public.patch_verification TO anon, authenticated;

CREATE VIEW public.leaderboard WITH (security_invoker = true) AS
WITH pv AS (SELECT * FROM public.patch_verification),
per AS (
  SELECT s.user_id,
    count(*) AS reviews,
    count(*) FILTER (WHERE pv.patch_id IS NOT NULL AND s.created_at > pv.flagged_at AND s.verdict IN ('candidate','static')) AS verifications
  FROM public.swipes s LEFT JOIN pv ON pv.patch_id = s.patch_id
  WHERE s.user_id IS NOT NULL GROUP BY s.user_id
), disc AS (
  SELECT discoverer_id AS user_id, count(*) AS first_flags, count(*) FILTER (WHERE status = 'confirmed') AS confirmed
  FROM pv WHERE discoverer_id IS NOT NULL GROUP BY discoverer_id
)
SELECT p.user_id, pr.display_name, pr.avatar_url,
  p.reviews::int, p.verifications::int,
  coalesce(d.first_flags, 0)::int AS first_flags, coalesce(d.confirmed, 0)::int AS confirmed,
  (p.reviews + 5 * p.verifications + 10 * coalesce(d.first_flags, 0) + 100 * coalesce(d.confirmed, 0))::int AS points
FROM per p LEFT JOIN disc d USING (user_id) LEFT JOIN public.profiles pr ON pr.id = p.user_id;
GRANT SELECT ON public.leaderboard TO anon, authenticated;