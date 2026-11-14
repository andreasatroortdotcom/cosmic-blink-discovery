-- Aggregate views run as their owner so the public sees only totals, never raw rows.
ALTER VIEW public.swipe_stats SET (security_invoker = false);
ALTER VIEW public.candidate_patches SET (security_invoker = false);
ALTER VIEW public.patch_verification SET (security_invoker = false);
ALTER VIEW public.leaderboard SET (security_invoker = false);
GRANT SELECT ON public.swipe_stats, public.candidate_patches, public.patch_verification, public.leaderboard TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can read swipes" ON public.swipes;
CREATE POLICY "Users read own swipes" ON public.swipes FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Profiles are public" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.session_seen_patches(_session text, _secret text)
RETURNS SETOF text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.patch_id FROM swipes s
  WHERE s.user_session_id = _session
    AND EXISTS (SELECT 1 FROM guest_sessions g WHERE g.session_id = _session
                AND g.secret_hash = encode(sha256(convert_to(_secret, 'UTF8')), 'hex'))
  LIMIT 1000
$$;
REVOKE ALL ON FUNCTION public.session_seen_patches(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.session_seen_patches(text, text) TO anon, authenticated;