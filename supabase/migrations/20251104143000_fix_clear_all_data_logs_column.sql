-- Corrige a função clear_all_data removendo a coluna 'level' que não existe na tabela logs
-- A tabela logs possui apenas: id, created_at, message, error

CREATE OR REPLACE FUNCTION clear_all_data()
RETURNS void AS $$
BEGIN
    -- Limpa as tabelas `patients` e `calls`
    TRUNCATE TABLE public.patients, public.calls RESTART IDENTITY CASCADE;

    -- Insere um log de sucesso (sem a coluna 'level' que não existe)
    INSERT INTO public.logs (message)
    VALUES ('Limpeza completa de dados executada com sucesso via RPC.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garante que as permissões de execução permaneçam
GRANT EXECUTE ON FUNCTION public.clear_all_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_all_data() TO service_role;
