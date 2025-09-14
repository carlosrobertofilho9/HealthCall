import { createClient } from "npm:@supabase/supabase-js@2.27.0";

// --- Configuração Essencial ---
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Validação inicial para garantir que as variáveis de ambiente existem.
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERRO: Uma ou mais variáveis de ambiente (URL ou KEY) não foram definidas.');
  // Interrompe a execução se as variáveis não estiverem presentes.
  Deno.exit(1);
}

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false
  }
});

// --- Função de Limpeza ---
// Apaga todos os dados de uma tabela específica.
async function truncateTable(tableName) {
  console.info(`Iniciando exclusão de dados da tabela: ${tableName}`);
  
  // Usamos .not('id', 'is', null) que se traduz para "WHERE id IS NOT NULL".
  // Isso seleciona todas as linhas e funciona para qualquer tipo de coluna (UUID, int, etc).
  const { error } = await client.from(tableName).delete().not('id', 'is', null);

  if (error) {
    console.error(`Falha ao limpar a tabela ${tableName}:`, error.message);
    throw error;
  }

  console.info(`Dados da tabela ${tableName} excluídos com sucesso.`);
  return {
    table: tableName,
    status: 'success'
  };
}

// --- Servidor Principal ---
Deno.serve(async (req)=>{
  // Adicionado para lidar com a chamada de "aquecimento" do Supabase ou testes de preflight.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    console.log("Iniciando limpeza das tabelas 'calls' e 'patients'.");
    
    const results = [];
    // Ordem: apague tabelas "filhas" antes das "mães" para evitar erros de chave estrangeira.
    results.push(await truncateTable('calls'));
    results.push(await truncateTable('patients'));

    return new Response(JSON.stringify({
      message: 'Limpeza executada com sucesso.',
      results
    }), {
      headers: {
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (err) {
    // Bloco de captura de erros gerais (falha de rede, erro no Supabase, etc.)
    console.error('Ocorreu um erro inesperado durante a execução:', err);
    return new Response(JSON.stringify({
      error: 'Erro interno do servidor.',
      details: err instanceof Error ? err.message : String(err)
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});
