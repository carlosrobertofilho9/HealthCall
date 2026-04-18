BEGIN;

ALTER TABLE public.pendencias
  ADD COLUMN IF NOT EXISTS prioridade text NOT NULL DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta')),
  ADD COLUMN IF NOT EXISTS prazo date,
  ADD COLUMN IF NOT EXISTS responsavel text;

CREATE INDEX IF NOT EXISTS idx_pendencias_status_prazo ON public.pendencias(status, prazo);
CREATE INDEX IF NOT EXISTS idx_pendencias_prazo ON public.pendencias(prazo);
CREATE INDEX IF NOT EXISTS idx_pendencias_prioridade ON public.pendencias(prioridade);

COMMIT;
