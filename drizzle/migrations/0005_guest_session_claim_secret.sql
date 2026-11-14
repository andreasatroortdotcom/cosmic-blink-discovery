CREATE TABLE public.guest_sessions (
  session_id text PRIMARY KEY,
  secret_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.guest_sessions TO service_role;
ALTER TABLE public.guest_sessions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.register_guest_session(_session text, _secret text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE h text := encode(sha256(convert_to(_secret, 'UTF8')), 'hex');
BEGIN
  IF length(_session) < 16 OR length(_secret) < 16 THEN RAISE EXCEPTION 'INVALID_SESSION'; END IF;
  IF NOT EXISTS (SELECT 1 FROM guest_sessions WHERE session_id = _session)
     AND NOT EXISTS (SELECT 1 FROM swipes WHERE user_session_id = _session) THEN
    INSERT INTO guest_sessions(session_id, secret_hash) VALUES (_session, h) ON CONFLICT DO NOTHING;
  END IF;
  RETURN EXISTS (SELECT 1 FROM guest_sessions WHERE session_id = _session AND secret_hash = h);
END $$;
REVOKE ALL ON FUNCTION public.register_guest_session(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_guest_session(text, text) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.claim_guest_swipes(text);
CREATE FUNCTION public.claim_guest_swipes(_session text, _secret text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF NOT EXISTS (SELECT 1 FROM guest_sessions WHERE session_id = _session
                 AND secret_hash = encode(sha256(convert_to(_secret, 'UTF8')), 'hex')) THEN RETURN 0; END IF;
  IF EXISTS (SELECT 1 FROM swipes WHERE user_session_id = _session AND user_id IS NOT NULL AND user_id <> auth.uid()) THEN RETURN 0; END IF;
  UPDATE swipes s SET user_id = auth.uid()
  WHERE s.user_session_id = _session AND s.user_id IS NULL
    AND NOT EXISTS (SELECT 1 FROM swipes o WHERE o.user_id = auth.uid() AND o.patch_id = s.patch_id);
  GET DIAGNOSTICS n = ROW_COUNT; RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.claim_guest_swipes(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_guest_swipes(text, text) TO authenticated;

-- Swipes may only come from a registered browser session, so a session id can't be hijacked once it appears publicly.
CREATE OR REPLACE FUNCTION public.require_registered_session()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM guest_sessions WHERE session_id = NEW.user_session_id) THEN
    RAISE EXCEPTION 'SESSION_NOT_REGISTERED';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER aa_require_registered_session BEFORE INSERT ON public.swipes
  FOR EACH ROW EXECUTE FUNCTION public.require_registered_session();

DROP POLICY IF EXISTS "Anyone can record swipes" ON public.swipes;
CREATE POLICY "Anyone can record swipes" ON public.swipes FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());