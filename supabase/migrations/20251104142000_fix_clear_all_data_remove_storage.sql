-- Corrige a função clear_all_data removendo a tentativa de deletar arquivos do storage
-- A função storage.delete_objects não existe no Supabase Storage
-- A limpeza do storage deve ser feita pelo cliente ou por uma Edge Function

CREATE OR REPLACE FUNCTION clear_all_data()
RETURNS void AS $$
BEGIN
    -- Limpa as tabelas `patients` e `calls`
    TRUNCATE TABLE public.patients, public.calls RESTART IDENTITY CASCADE;

    -- Insere um log de sucesso
    INSERT INTO public.logs (message, level)
    VALUES ('Limpeza completa de dados executada com sucesso via RPC. Nota: Arquivos de áudio devem ser limpos pelo cliente.', 'info');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garante que as permissões de execução permaneçam
GRANT EXECUTE ON FUNCTION public.clear_all_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_all_data() TO service_role;
