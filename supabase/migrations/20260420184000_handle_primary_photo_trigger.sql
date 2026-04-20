BEGIN;

-- Criar função para garantir apenas uma foto primária por ferida
CREATE OR REPLACE FUNCTION public.handle_wound_primary_photo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se a nova foto (ou foto atualizada) for marcada como primária
  IF NEW.is_primary = true AND (OLD.is_primary IS NULL OR OLD.is_primary = false) AND NEW.deleted_at IS NULL THEN
    -- Desmarcar todas as outras fotos primárias da mesma ferida
    UPDATE public.wound_photos
    SET is_primary = false
    WHERE wound_id = NEW.wound_id
      AND id <> NEW.id
      AND is_primary = true
      AND deleted_at IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar gatilho na tabela wound_photos
DROP TRIGGER IF EXISTS trg_wound_photos_ensure_single_primary ON public.wound_photos;
CREATE TRIGGER trg_wound_photos_ensure_single_primary
BEFORE INSERT OR UPDATE ON public.wound_photos
FOR EACH ROW
EXECUTE FUNCTION public.handle_wound_primary_photo();

COMMIT;
