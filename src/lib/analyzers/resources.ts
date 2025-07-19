import { ParsedMessage, Resource } from '@/types';

const URL_REGEX = /(https?:\/\/[^\s]+)/gi;

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}

function categorizeResource(url: string, context: string): 'link' | 'tool' | 'document' {
  const domain = extractDomain(url).toLowerCase();
  const contextLower = context.toLowerCase();
  
  const documentDomains = ['docs.google.com', 'notion.so', 'airtable.com', 'dropbox.com', 'drive.google.com'];
  const toolDomains = ['github.com', 'figma.com', 'slack.com', 'trello.com', 'asana.com'];
  
  if (documentDomains.some(d => domain.includes(d))) {
    return 'document';
  }
  
  if (toolDomains.some(d => domain.includes(d))) {
    return 'tool';
  }
  
  const toolKeywords = ['tool', 'app', 'software', 'platform', 'dashboard', 'api'];
  if (toolKeywords.some(keyword => contextLower.includes(keyword))) {
    return 'tool';
  }
  
  const documentKeywords = ['doc', 'sheet', 'file', 'document', 'pdf', 'report'];
  if (documentKeywords.some(keyword => contextLower.includes(keyword))) {
    return 'document';
  }
  
  return 'link';
}

async function fetchUrlTitle(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (response.ok) {
      const fullResponse = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const html = await fullResponse.text();
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      return titleMatch ? titleMatch[1].trim() : undefined;
    }
  } catch {
    // Fail silently
  }
  return undefined;
}

export function extractResources(messages: ParsedMessage[]): Resource[] {
  const resources: Resource[] = [];
  
  messages
    .filter(msg => msg.type === 'text')
    .forEach(msg => {
      const urls = msg.content.match(URL_REGEX);
      if (urls) {
        urls.forEach(url => {
          const cleanUrl = url.replace(/[.,!?;]$/, ''); // Remove trailing punctuation
          const domain = extractDomain(cleanUrl);
          const category = categorizeResource(cleanUrl, msg.content);
          
          resources.push({
            url: cleanUrl,
            domain,
            sharedBy: msg.author,
            dateShared: msg.timestamp,
            context: msg.content.substring(0, 200),
            category,
          });
        });
      }
    });
  
  return resources.sort((a, b) => b.dateShared.getTime() - a.dateShared.getTime());
}

export async function enrichResourcesWithTitles(resources: Resource[]): Promise<Resource[]> {
  const enrichedResources = await Promise.all(
    resources.map(async (resource) => {
      const title = await fetchUrlTitle(resource.url);
      return { ...resource, title };
    })
  );
  
  return enrichedResources;
}