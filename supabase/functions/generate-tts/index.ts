import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.159.0/crypto/mod.ts';

const STORAGE_BUCKET = 'tts-audio';
const AUDIO_CACHE_CONTROL_SECONDS = '31536000';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonHeaders = {
	...corsHeaders,
	'Content-Type': 'application/json',
	'Cache-Control': 'public, max-age=300',
};

// Função que busca o áudio do Google Translate
async function getGoogleTranslateAudio(text: string): Promise<ArrayBuffer> {
	const encodedText = encodeURIComponent(text);
	const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=pt-BR&client=tw-ob`;

	const response = await fetch(url, {
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch audio from Google Translate: ${response.statusText}`);
	}

	return response.arrayBuffer();
}

serve(async (req) => {
	// Handle preflight OPTIONS request
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const { text } = await req.json();
		if (!text) return new Response('Missing text', { status: 400, headers: corsHeaders });

		// Crie um hash do texto para usar como nome de arquivo (cache)
		const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
		const hash = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
		const fileName = `${hash}.mp3`;

		const supabaseAdmin = createClient(
			Deno.env.get('SUPABASE_URL') ?? '',
			Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
		);

		// Verifica se o arquivo já existe no Storage
		const { data: fileList } = await supabaseAdmin.storage.from(STORAGE_BUCKET).list(undefined, {
			search: fileName,
			limit: 1,
		});

		if (fileList && fileList.length > 0) {
			const { data: publicUrlData } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
			return new Response(JSON.stringify({ speechUrl: publicUrlData.publicUrl }), {
				headers: jsonHeaders,
			});
		}

		// Se não existe, gera o áudio
		const audioBuffer = await getGoogleTranslateAudio(text);

		// Salva o novo áudio no Supabase Storage
		const { error: uploadError } = await supabaseAdmin.storage
			.from(STORAGE_BUCKET)
			.upload(fileName, audioBuffer, {
				contentType: 'audio/mpeg',
				cacheControl: AUDIO_CACHE_CONTROL_SECONDS,
				upsert: true,
			});

		if (uploadError) throw uploadError;

		// Retorna a URL pública do arquivo recém-criado
		const { data: publicUrlData } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);

		return new Response(JSON.stringify({ speechUrl: publicUrlData.publicUrl }), {
			headers: jsonHeaders,
		});
	} catch (error) {
		console.error('Error in generate-tts function:', error);
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: jsonHeaders,
		});
	}
});
