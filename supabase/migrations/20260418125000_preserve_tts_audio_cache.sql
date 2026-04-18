-- Preserve o cache de TTS para reduzir Supabase Storage Cached Egress.
-- Os arquivos são nomeados por hash do texto, então são seguros para reutilização.

DO $$
DECLARE
  v_job_id bigint;
BEGIN
  SELECT jobid INTO v_job_id FROM cron.job WHERE jobname = 'display-tts-cache-cleanup-daily';
  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;
END
$$;

