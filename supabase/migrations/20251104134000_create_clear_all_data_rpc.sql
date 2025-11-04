-- 1. Definição da função SQL `clear_all_data`.
-- Esta função é projetada para limpar completamente os dados de operação diária,
-- incluindo registros de pacientes, chamadas e arquivos de áudio gerados.
-- Ela garante que as operações de limpeza sejam atômicas e seguras.
CREATE OR REPLACE FUNCTION clear_all_data()
RETURNS void AS $$
DECLARE
    -- Variável para armazenar cada objeto de arquivo retornado do bucket de armazenamento.
    file_object JSON;
BEGIN
    -- 2. Limpa a tabela `patients`, removendo todos os registros de pacientes da fila.
    -- O uso de TRUNCATE com RESTART IDENTITY reinicia a contagem de IDs, se aplicável,
    -- e CASCADE remove registros dependentes em outras tabelas.
    TRUNCATE TABLE public.patients RESTART IDENTITY CASCADE;

    -- 3. Limpa a tabela `calls`, deletando todo o histórico de chamadas.
    -- Esta ação é crucial para garantir que a tela de exibição não mostre chamadas antigas.
    TRUNCATE TABLE public.calls RESTART IDENTITY CASCADE;

    -- 4. Lista todos os objetos (arquivos) no bucket `tts-audio`.
    -- A função `storage.list_objects` retorna um array de JSON, que será iterado.
    -- Este passo é o primeiro na limpeza do armazenamento de áudios.
    FOR file_object IN
        SELECT * FROM storage.objects WHERE bucket_id = 'tts-audio'
    LOOP
        -- 5. Remove cada arquivo de áudio individualmente do bucket `tts-audio`.
        -- A função `storage.delete_object` utiliza o nome do arquivo extraído do JSON
        -- para realizar a exclusão. Isso garante que nenhum áudio antigo permaneça.
        PERFORM storage.delete_object('tts-audio', file_object->>'name');
    END LOOP;

    -- 6. Insere um log de sucesso após a conclusão da limpeza.
    -- Isso fornece um registro auditável de que a operação foi executada com sucesso.
    INSERT INTO public.logs (message, level)
    VALUES ('Limpeza completa de dados executada com sucesso via RPC.', 'info');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Concede permissão de execução da função `clear_all_data` para o role `authenticated`.
-- Isso permite que usuários autenticados chamem esta RPC a partir do frontend,
-- o que é necessário para a funcionalidade do botão "Limpar Fila".
GRANT EXECUTE ON FUNCTION public.clear_all_data() TO authenticated;

-- 8. Concede permissão de execução para o role `service_role`.
-- Embora o SECURITY DEFINER use as permissões do proprietário da função,
-- conceder ao `service_role` explicitamente pode ser útil para manutenção
-- e para garantir que scripts de backend possam também invocar a função.
GRANT EXECUTE ON FUNCTION public.clear_all_data() TO service_role;
