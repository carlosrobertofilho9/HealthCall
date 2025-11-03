-- Cria a função para limpar a tabela de pacientes
CREATE OR REPLACE FUNCTION truncate_patients()
RETURNS void AS $$
BEGIN
  TRUNCATE TABLE public.patients;
END;
$$ LANGUAGE plpgsql;

-- Concede permissão para usuários autenticados executarem a função
GRANT EXECUTE ON FUNCTION truncate_patients() TO authenticated;

-- Agenda a função de limpeza do bucket de TTS para rodar todo dia à meia-noite
SELECT cron.schedule('cleanup-tts-bucket', '0 0 * * *', 'SELECT net.http_post("http://localhost:54321/functions/v1/cleanup-tts-bucket", ''{}'', ''{}'', ''{"Content-Type": "application/json"}'')');

-- Agenda a função de limpeza do banco de dados para rodar todo dia à meia-noite
SELECT cron.schedule('cleanup-database', '0 0 * * *', 'SELECT net.http_post("http://localhost:54321/functions/v1/cleanup-database", ''{}'', ''{}'', ''{"Content-Type": "application/json"}'')');