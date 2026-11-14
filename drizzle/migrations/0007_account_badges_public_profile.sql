CREATE TABLE public.user_badges (
  user_id uuid NOT NULL,
  badge_id text NOT NULL CHECK (badge_id ~ '^[a-z0-9-]{1,40}$'),
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);
GRANT SELECT, INSERT ON public.user_badges TO authenticated;
GRANT ALL ON public.user_badges TO service_role;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own badges" ON public.user_badges FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Unlock own badges" ON public.user_badges FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.public_profile(_id uuid)
RETURNS TABLE(display_name text, reviewed bigint, flagged bigint, days text[], badges text[], member_since timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.display_name,
    (SELECT count(*) FROM swipes s WHERE s.user_id = p.id AND s.verdict IN ('static','candidate')),
    (SELECT count(*) FROM swipes s WHERE s.user_id = p.id AND s.verdict = 'candidate'),
    COALESCE((SELECT array_agg(DISTINCT to_char(s.created_at, 'YYYY-MM-DD')) FROM swipes s WHERE s.user_id = p.id), '{}'),
    COALESCE((SELECT array_agg(b.badge_id ORDER BY b.unlocked_at) FROM user_badges b WHERE b.user_id = p.id), '{}'),
    p.created_at
  FROM profiles p WHERE p.id = _id
$$;
GRANT EXECUTE ON FUNCTION public.public_profile(uuid) TO anon, authenticated;