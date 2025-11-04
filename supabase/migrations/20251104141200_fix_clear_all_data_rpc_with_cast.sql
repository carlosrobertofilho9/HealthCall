-- 1. Redefinição final da função SQL `clear_all_data` para corrigir o erro de tipo.
-- Esta versão adiciona uma conversão de tipo explícita (`::text`) ao chamar `storage.delete_objects`,
-- resolvendo o erro "function does not exist" retornado pelo Postgres.
CREATE OR REPLACE FUNCTION clear_all_data()
RETURNS void AS $$
DECLARE
    -- Variável para armazenar a lista de nomes de arquivos a serem deletados.
    files_to_delete TEXT[];
BEGIN
    -- 2. Limpa as tabelas `patients` e `calls`.
    TRUNCATE TABLE public.patients, public.calls RESTART IDENTITY CASCADE;

    -- 3. Seleciona os nomes de todos os arquivos no bucket `tts-audio`.
    SELECT ARRAY_AGG(name) INTO files_to_delete
    FROM storage.objects
    WHERE bucket_id = 'tts-audio';

    -- 4. Se houver arquivos, chama `storage.delete_objects` com a conversão de tipo explícita.
    -- A conversão `'tts-audio'::text` garante que o Postgres reconheça a assinatura da função.
    IF array_length(files_to_delete, 1) > 0 THEN
        PERFORM storage.delete_objects('tts-audio'::text, files_to_delete);
    END IF;

    -- 5. Insere um log de sucesso.
    INSERT INTO public.logs (message, level)
    VALUES ('Limpeza completa de dados (versão final corrigida) executada com sucesso via RPC.', 'info');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Garante que as permissões de execução permaneçam.
GRANT EXECUTE ON FUNCTION public.clear_all_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_all_data() TO service_role;
