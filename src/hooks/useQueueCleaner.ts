import { useEffect } from 'react';
import { clearQueue } from '@/features/dashboard/services/patientService';
import { supabase } from '@/lib/supabaseClient';

const MAX_RETRIES = 1; // Tenta a execução inicial + 1 repetição

async function logError(error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
  await supabase.from('logs').insert({
    message: 'Failed to clear patient queue',
    error: { details: errorMessage, error },
  });
}

async function runCleaning() {
  let attempts = 0;
  while (attempts <= MAX_RETRIES) {
    try {
      await clearQueue();
      console.log('Queue cleared successfully.');
      return; // Sucesso, sair da função
    } catch (error) {
      attempts++;
      if (attempts > MAX_RETRIES) {
        console.error('Failed to clear queue after multiple retries.', error);
        await logError(error);
        break; // Sai do loop após a última tentativa
      }
      console.warn(`Attempt ${attempts} to clear queue failed. Retrying...`);
    }
  }
}

export function useQueueCleaner() {
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    const lastCleanedDate = localStorage.getItem('lastQueueCleanDate');

    if (lastCleanedDate !== today) {
      console.log('Running daily queue cleaning...');
      runCleaning().then(() => {
        // Marca como limpo para hoje, mesmo se falhar, para não tentar de novo até amanhã
        localStorage.setItem('lastQueueCleanDate', today);
      });
    } else {
      console.log('Queue has already been cleaned today.');
    }
  }, []); // Executa apenas uma vez quando o componente é montado
}
