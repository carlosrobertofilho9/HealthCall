import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.159.0/crypto/mod.ts';

const STORAGE_BUCKET = 'media';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maximum characters per Google Translate TTS request
const MAX_CHARS_PER_REQUEST = 180;

/**
 * Split text into chunks that respect sentence boundaries
 */
function splitTextIntoChunks(text: string, maxLength: number): string[] {
	if (text.length <= maxLength) return [text];

	const chunks: string[] = [];
	// Match sentences ending with punctuation OR capture remaining text
	const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
	
	let currentChunk = '';
	
	for (const sentence of sentences) {
		const trimmed = sentence.trim();
		
		// If single sentence is too long, split by comma or space
		if (trimmed.length > maxLength) {
			if (currentChunk) {
				chunks.push(currentChunk.trim());
				currentChunk = '';
			}
			
			// Try splitting by comma first
			const parts = trimmed.split(',').map(p => p.trim());
			for (const part of parts) {
				if (part.length > maxLength) {
					// Last resort: split by words
					const words = part.split(' ');
					let wordChunk = '';
					for (const word of words) {
						if ((wordChunk + ' ' + word).length > maxLength) {
							if (wordChunk) chunks.push(wordChunk.trim());
							wordChunk = word;
						} else {
							wordChunk += (wordChunk ? ' ' : '') + word;
						}
					}
					if (wordChunk) chunks.push(wordChunk.trim());
				} else {
					if ((currentChunk + ' ' + part).length > maxLength) {
						if (currentChunk) chunks.push(currentChunk.trim());
						currentChunk = part;
					} else {
						currentChunk += (currentChunk ? ', ' : '') + part;
					}
				}
			}
		} else {
			// Add sentence to current chunk if it fits
			if ((currentChunk + ' ' + trimmed).length > maxLength) {
				if (currentChunk) chunks.push(currentChunk.trim());
				currentChunk = trimmed;
			} else {
				currentChunk += (currentChunk ? ' ' : '') + trimmed;
			}
		}
	}
	
	if (currentChunk) chunks.push(currentChunk.trim());
	
	return chunks.filter(c => c.length > 0);
}

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

/**
 * Concatenate multiple MP3 files into one
 */
async function concatenateAudioBuffers(buffers: ArrayBuffer[]): Promise<ArrayBuffer> {
	if (buffers.length === 1) return buffers[0];
	
	// Simple concatenation for MP3 files
	const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;
	
	for (const buffer of buffers) {
		result.set(new Uint8Array(buffer), offset);
		offset += buffer.byteLength;
	}
	
	return result.buffer;
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
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		// Split text into chunks if needed
		const chunks = splitTextIntoChunks(text, MAX_CHARS_PER_REQUEST);
		console.log(`[TTS] Processing ${chunks.length} chunk(s) for text of length ${text.length}`);

		// Generate audio for each chunk
		const audioBuffers: ArrayBuffer[] = [];
		for (let i = 0; i < chunks.length; i++) {
			console.log(`[TTS] Generating chunk ${i + 1}/${chunks.length}: "${chunks[i].substring(0, 50)}..."`);
			const buffer = await getGoogleTranslateAudio(chunks[i]);
			audioBuffers.push(buffer);
		}

		// Concatenate all audio buffers
		const finalAudioBuffer = await concatenateAudioBuffers(audioBuffers);

		// Salva o novo áudio no Supabase Storage
		const { error: uploadError } = await supabaseAdmin.storage
			.from(STORAGE_BUCKET)
			.upload(fileName, finalAudioBuffer, { contentType: 'audio/mpeg', upsert: true });

		if (uploadError) throw uploadError;

		// Retorna a URL pública do arquivo recém-criado
		const { data: publicUrlData } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);

		return new Response(JSON.stringify({ speechUrl: publicUrlData.publicUrl }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('Error in generate-tts function:', error);
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	}
});
