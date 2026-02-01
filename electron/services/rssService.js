/**
 * Serviço local para buscar feeds RSS
 * Substitui a Edge Function do Supabase
 */

import { XMLParser } from 'fast-xml-parser';

// Parser XML configurado
const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_'
});

/**
 * Busca e parseia um feed RSS
 * @param {string} url - URL do feed RSS
 * @returns {Promise<Array>} Array de itens do feed
 */
export async function fetchRssFeed(url) {
    try {
        console.log('[RSS] Fetching feed from:', url);
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'HealthCall/2.0 RSS Reader',
                'Accept': 'application/rss+xml, application/xml, text/xml'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const xmlText = await response.text();
        const result = parser.parse(xmlText);
        
        // Extrai os itens do feed (suporta RSS 2.0 e Atom)
        let items = [];
        
        if (result.rss?.channel?.item) {
            // RSS 2.0
            items = Array.isArray(result.rss.channel.item) 
                ? result.rss.channel.item 
                : [result.rss.channel.item];
        } else if (result.feed?.entry) {
            // Atom
            items = Array.isArray(result.feed.entry) 
                ? result.feed.entry 
                : [result.feed.entry];
        }
        
        // Normaliza os itens para um formato comum
        const normalizedItems = items.map(item => ({
            title: item.title || item['media:title'] || 'Sem título',
            description: stripHtml(item.description || item.summary || item.content || ''),
            link: item.link?.['@_href'] || item.link || '',
            pubDate: item.pubDate || item.published || item.updated || new Date().toISOString(),
            image: extractImage(item)
        }));
        
        console.log('[RSS] Fetched', normalizedItems.length, 'items');
        return normalizedItems;
        
    } catch (error) {
        console.error('[RSS] Error fetching feed:', error);
        throw error;
    }
}

/**
 * Remove tags HTML de uma string
 */
function stripHtml(html) {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim()
        .substring(0, 500); // Limita o tamanho
}

/**
 * Extrai URL da imagem de um item do feed
 */
function extractImage(item) {
    // Tenta diferentes formatos de imagem
    if (item['media:content']?.['@_url']) {
        return item['media:content']['@_url'];
    }
    if (item['media:thumbnail']?.['@_url']) {
        return item['media:thumbnail']['@_url'];
    }
    if (item.enclosure?.['@_url'] && item.enclosure['@_type']?.startsWith('image/')) {
        return item.enclosure['@_url'];
    }
    if (item.image?.url) {
        return item.image.url;
    }
    
    // Tenta extrair imagem do conteúdo HTML
    const content = item.description || item.content || '';
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch) {
        return imgMatch[1];
    }
    
    return null;
}

export default {
    fetchRssFeed
};
