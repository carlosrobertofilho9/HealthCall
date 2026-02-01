import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

console.log("Hello from Functions!")

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    if (!url) {
        throw new Error("Missing URL parameter");
    }

    console.log(`Fetching RSS from: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch RSS: ${response.statusText}`);
    }

    const xmlText = await response.text();
    
    // Parse XML manually (simple regex/string manipulation is often safer/faster for simple RSS than full DOM in Edge)
    const items: any[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemContent = match[1];
        
        // Extract Title
        const titleMatch = /<title>(.*?)<\/title>/.exec(itemContent);
        const title = titleMatch ? titleMatch[1].replace('<![CDATA[', '').replace(']]>', '') : '';

        // Extract Link
        const linkMatch = /<link>(.*?)<\/link>/.exec(itemContent);
        const link = linkMatch ? linkMatch[1] : '';

        // Extract Description (contains Image and Summary)
        const descriptionMatch = /<description>([\s\S]*?)<\/description>/.exec(itemContent);
        let description = descriptionMatch ? descriptionMatch[1] : '';
        
        // Extract Image from Description
        let image = '';
        const imgMatch = /<img[^>]+src="([^">]+)"/.exec(description);
        if (imgMatch) {
            image = imgMatch[1];
        }

        // Clean Description (remove CDATA, HTML tags)
        description = description
            .replace('<![CDATA[', '')
            .replace(']]>', '')
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .trim();
        
        if (title) {
            items.push({ 
                title,
                description,
                image,
                link
            });
        }
        
        if (items.length >= 10) break; // Limit to 10 latest news
    }

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
