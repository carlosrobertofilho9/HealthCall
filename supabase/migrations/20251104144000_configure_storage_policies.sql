-- Configuração de políticas de storage para o bucket tts-audio
-- Garante que usuários autenticados podem listar e deletar arquivos

-- 1. Remove políticas antigas se existirem
DROP POLICY IF EXISTS "Allow authenticated users to list files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects;

-- 2. Cria a política para permitir que usuários autenticados listem arquivos
CREATE POLICY "Allow authenticated users to list files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'tts-audio');

-- 3. Cria a política para permitir que usuários autenticados deletem arquivos
CREATE POLICY "Allow authenticated users to delete files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'tts-audio');

-- 4. Insere um log de configuração
INSERT INTO public.logs (message)
VALUES ('Políticas de storage configuradas para permitir listagem e deleção de arquivos no bucket tts-audio por usuários autenticados.');
