ALTER TABLE public.swipes ADD COLUMN ip_hash text;
REVOKE SELECT ON public.swipes FROM anon, authenticated;
GRANT SELECT (id, patch_id, ra, dec, constellation, verdict, candidate_type, user_session_id, created_at) ON public.swipes TO anon, authenticated;
ALTER TABLE public.swipes ADD CONSTRAINT swipes_one_vote_per_patch UNIQUE (user_session_id, patch_id);
CREATE INDEX swipes_session_time_idx ON public.swipes (user_session_id, created_at DESC);
CREATE INDEX swipes_ip_time_idx ON public.swipes (ip_hash, created_at DESC);

CREATE OR REPLACE FUNCTION public.enforce_swipe_limits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  hdrs json := nullif(current_setting('request.headers', true), '')::json;
  ip text := coalesce(split_part(hdrs->>'x-forwarded-for', ',', 1), hdrs->>'cf-connecting-ip', 'unknown');
BEGIN
  NEW.ip_hash := md5('astroswipe:' || trim(ip));
  NEW.created_at := now();
  IF (SELECT count(*) FROM swipes WHERE user_session_id = NEW.user_session_id AND created_at > now() - interval '1 minute') >= 20 THEN
    RAISE EXCEPTION 'RATE_LIMIT: too many reviews, slow down' USING ERRCODE = 'P0001';
  END IF;
  IF (SELECT count(*) FROM swipes WHERE user_session_id = NEW.user_session_id AND created_at > now() - interval '1 day') >= 500 THEN
    RAISE EXCEPTION 'RATE_LIMIT: daily review limit reached' USING ERRCODE = 'P0001';
  END IF;
  IF (SELECT count(*) FROM swipes WHERE ip_hash = NEW.ip_hash AND created_at > now() - interval '1 minute') >= 120 THEN
    RAISE EXCEPTION 'RATE_LIMIT: too many reviews from this network' USING ERRCODE = 'P0001';
  END IF;
  IF NEW.verdict = 'candidate' AND (SELECT count(*) FROM swipes WHERE ip_hash = NEW.ip_hash AND patch_id = NEW.patch_id AND verdict = 'candidate') >= 3 THEN
    RAISE EXCEPTION 'DUPLICATE: this patch was already flagged from this network' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.enforce_swipe_limits() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER swipes_enforce_limits BEFORE INSERT ON public.swipes FOR EACH ROW EXECUTE FUNCTION public.enforce_swipe_limits();