import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STORAGE_BUCKET = 'tts-audio';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
	// This function is designed to be called by a cron job.
	// We'll handle OPTIONS for potential direct invocation tests.
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const supabaseAdmin = createClient(
			Deno.env.get('SUPABASE_URL') ?? '',
			Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
		);

		// 1. List all files in the bucket
		const { data: files, error: listError } = await supabaseAdmin.storage.from(STORAGE_BUCKET).list();

		if (listError) {
			throw listError;
		}

		if (!files || files.length === 0) {
			console.log(`Bucket "${STORAGE_BUCKET}" is already empty.`);
			return new Response(JSON.stringify({ message: 'Bucket is already empty' }), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		// 2. Extract file names to be deleted
		const fileNames = files.map((file) => file.name);

		// 3. Remove all files from the bucket
		const { error: removeError } = await supabaseAdmin.storage.from(STORAGE_BUCKET).remove(fileNames);

		if (removeError) {
			throw removeError;
		}

		console.log(`Successfully deleted ${fileNames.length} files from bucket "${STORAGE_BUCKET}".`);
		return new Response(JSON.stringify({ message: `Successfully deleted ${fileNames.length} files.` }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('Error cleaning up bucket:', error);
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	}
});
