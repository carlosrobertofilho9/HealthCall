-- Execute este SQL no painel SQL do Supabase Dashboard para adicionar o campo duration
-- URL: https://supabase.com/dashboard/project/itxvexnhoafehwmlhulo/sql

-- Verificar se a coluna já existe antes de adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'warnings' 
        AND column_name = 'duration'
    ) THEN
        ALTER TABLE warnings ADD COLUMN duration INTEGER;
        COMMENT ON COLUMN warnings.duration IS 'Duration in seconds for video/youtube warnings. Used to control how long the warning is displayed.';
        RAISE NOTICE 'Coluna duration adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna duration já existe';
    END IF;
END $$;

-- Verificar a estrutura da tabela warnings
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'warnings'
ORDER BY ordinal_position;
