-- Configuração do Storage para o bucket 'media'
-- Execute este script no SQL Editor do seu console Supabase para corrigir o erro de permissão (RLS)

-- 1. Garantir que o bucket 'media' exista e seja público
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Permitir que usuários autenticados façam upload de arquivos
-- Se o seu sistema não tiver login e você quiser permitir uploads anônimos, use 'public' em vez de 'authenticated' no comando TO
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- 3. Permitir que qualquer pessoa visualize os arquivos (Público)
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');

-- 4. Permitir que usuários autenticados atualizem seus próprios arquivos
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media');

-- 5. Permitir que usuários autenticados excluam arquivos
CREATE POLICY "Allow authenticated deletions"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media');
