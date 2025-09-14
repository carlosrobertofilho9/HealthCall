// supabase/functions/generate-tts/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from "https://deno.land/std@0.159.0/crypto/mod.ts";

const GOOGLE_TTS_API_KEY = Deno.env.get('GOOGLE_TTS_API_KEY');
const TTS_API_URL = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`;
const STORAGE_BUCKET = 'tts-audio'; // Crie este bucket no seu Supabase

serve(async (req) => {
  const { text } = await req.json();
  if (!text) return new Response('Missing text', { status: 400 });

  // Crie um hash do texto para usar como nome de arquivo (cache)
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  const fileName = `${hash}.mp3`;

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Verifica se o arquivo já existe no Storage
  const { data: existingFile } = await supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
  if (existingFile && existingFile.publicUrl) {
      return new Response(JSON.stringify({ speechUrl: existingFile.publicUrl }), {
          headers: { 'Content-Type': 'application/json' },
      });
  }

  // Se não existe, gera o áudio
  const ttsResponse = await fetch(TTS_API_URL, {
    method: 'POST',
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: 'pt-BR', name: 'pt-BR-Wavenet-B' },
      audioConfig: { audioEncoding: 'MP3' },
    }),
  });
  if (!ttsResponse.ok) throw new Error(await ttsResponse.text());

  const { audioContent } = await ttsResponse.json();
  const audioBuffer = Uint8Array.from(atob(audioContent), c => c.charCodeAt(0));

  // Salva o novo áudio no Supabase Storage
  const { error: uploadError } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, audioBuffer, { contentType: 'audio/mpeg', upsert: true });

  if (uploadError) throw uploadError;

  // Retorna a URL pública do arquivo recém-criado
  const { data: publicUrlData } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);

  return new Response(JSON.stringify({ speechUrl: publicUrlData.publicUrl }), {
    headers: { 'Content-Type': 'application/json' },
  });
});