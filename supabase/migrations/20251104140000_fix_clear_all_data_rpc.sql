-- 1. Redefinição da função SQL `clear_all_data` para correção e otimização.
-- Esta versão corrige um bug de tipo de dado e melhora a eficiência da limpeza
-- do bucket de armazenamento, removendo todos os objetos de uma só vez.
CREATE OR REPLACE FUNCTION clear_all_data()
RETURNS void AS $$
DECLARE
    -- Variável para armazenar a lista de nomes de arquivos a serem deletados.
    files_to_delete TEXT[];
BEGIN
    -- 2. Limpa a tabela `patients`, removendo todos os registros de pacientes.
    TRUNCATE TABLE public.patients RESTART IDENTITY CASCADE;

    -- 3. Limpa a tabela `calls`, deletando todo o histórico de chamadas.
    TRUNCATE TABLE public.calls RESTART IDENTITY CASCADE;

    -- 4. Seleciona os nomes de todos os arquivos no bucket `tts-audio` e os armazena
    -- em um array de texto. Esta abordagem é mais eficiente do que iterar
    -- sobre cada objeto individualmente.
    SELECT ARRAY_AGG(name) INTO files_to_delete
    FROM storage.objects
    WHERE bucket_id = 'tts-audio';

    -- 5. Se houver arquivos para deletar, chama a função `storage.delete_objects`
    -- para remover todos eles em uma única operação. Isso corrige o erro anterior
    -- e é significativamente mais performático.
    IF array_length(files_to_delete, 1) > 0 THEN
        PERFORM storage.delete_objects('tts-audio', files_to_delete);
    END IF;

    -- 6. Insere um log de sucesso após a conclusão da limpeza.
    INSERT INTO public.logs (message, level)
    VALUES ('Limpeza completa de dados (versão corrigida) executada com sucesso via RPC.', 'info');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Garante que as permissões de execução permaneçam concedidas.
GRANT EXECUTE ON FUNCTION public.clear_all_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_all_data() TO service_role;
