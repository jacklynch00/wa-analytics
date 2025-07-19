import { ParsedMessage } from '@/types';

const WHATSAPP_MESSAGE_REGEX = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM)?)\]\s*([^:]+?):\s*(.*?)$/i;
const WHATSAPP_SYSTEM_REGEX = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM)?)\]\s*(.*?)$/i;

function parseTimestamp(dateStr: string, timeStr: string): Date {
  const cleanTimeStr = timeStr.replace(/\s+/g, ' ').trim();
  
  const dateParts = dateStr.split('/');
  let month: number, day: number, year: number;
  
  if (dateParts.length === 3) {
    month = parseInt(dateParts[0], 10);
    day = parseInt(dateParts[1], 10);
    year = parseInt(dateParts[2], 10);
    
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }
  } else {
    throw new Error(`Invalid date format: ${dateStr}`);
  }
  
  let hours: number, minutes: number, seconds: number;
  const isAMPM = /AM|PM/i.test(cleanTimeStr);
  
  if (isAMPM) {
    const timeMatch = cleanTimeStr.match(/(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) {
      throw new Error(`Invalid time format: ${cleanTimeStr}`);
    }
    
    hours = parseInt(timeMatch[1], 10);
    minutes = parseInt(timeMatch[2], 10);
    seconds = parseInt(timeMatch[3], 10);
    const isPM = timeMatch[4].toUpperCase() === 'PM';
    
    if (hours === 12) {
      hours = isPM ? 12 : 0;
    } else if (isPM) {
      hours += 12;
    }
  } else {
    const timeParts = cleanTimeStr.split(':');
    if (timeParts.length !== 3) {
      throw new Error(`Invalid time format: ${cleanTimeStr}`);
    }
    
    hours = parseInt(timeParts[0], 10);
    minutes = parseInt(timeParts[1], 10);
    seconds = parseInt(timeParts[2], 10);
  }
  
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

function isSystemMessage(content: string): boolean {
  const systemPatterns = [
    /added/i,
    /removed/i,
    /left/i,
    /joined/i,
    /changed.*subject/i,
    /changed.*group.*icon/i,
    /created.*group/i,
    /security.*code.*changed/i,
    /messages.*encryption/i,
    /missed.*call/i,
  ];
  
  return systemPatterns.some(pattern => pattern.test(content));
}

function detectAttachment(content: string): { isAttachment: boolean; info?: string } {
  const attachmentPatterns = [
    { pattern: /<attached:\s*(.+?)>/i, type: 'file' },
    { pattern: /image omitted/i, type: 'image' },
    { pattern: /video omitted/i, type: 'video' },
    { pattern: /audio omitted/i, type: 'audio' },
    { pattern: /document omitted/i, type: 'document' },
    { pattern: /contact card omitted/i, type: 'contact' },
    { pattern: /location omitted/i, type: 'location' },
    { pattern: /gif omitted/i, type: 'gif' },
    { pattern: /sticker omitted/i, type: 'sticker' },
  ];
  
  for (const { pattern, type } of attachmentPatterns) {
    const match = content.match(pattern);
    if (match) {
      return { 
        isAttachment: true, 
        info: match[1] ? `${type}: ${match[1]}` : type 
      };
    }
  }
  
  return { isAttachment: false };
}

export function parseWhatsAppExport(fileContent: string): ParsedMessage[] {
  const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const messages: ParsedMessage[] = [];
  let currentMessage: ParsedMessage | null = null;
  
  for (const line of lines) {
    const messageMatch = line.match(WHATSAPP_MESSAGE_REGEX);
    
    if (messageMatch) {
      if (currentMessage) {
        messages.push(currentMessage);
      }
      
      const [, dateStr, timeStr, author, content] = messageMatch;
      
      try {
        const timestamp = parseTimestamp(dateStr, timeStr);
        const attachment = detectAttachment(content);
        
        currentMessage = {
          timestamp,
          author: author.trim(),
          content: content.trim(),
          type: attachment.isAttachment ? 'attachment' : 'text',
          attachmentInfo: attachment.info,
        };
      } catch (error) {
        console.warn(`Failed to parse message timestamp: ${dateStr} ${timeStr}`, error);
        continue;
      }
    } else {
      const systemMatch = line.match(WHATSAPP_SYSTEM_REGEX);
      
      if (systemMatch) {
        if (currentMessage) {
          messages.push(currentMessage);
        }
        
        const [, dateStr, timeStr, content] = systemMatch;
        
        try {
          const timestamp = parseTimestamp(dateStr, timeStr);
          
          currentMessage = {
            timestamp,
            author: 'System',
            content: content.trim(),
            type: 'system',
          };
        } catch (error) {
          console.warn(`Failed to parse system message timestamp: ${dateStr} ${timeStr}`, error);
          continue;
        }
      } else if (currentMessage) {
        currentMessage.content += '\n' + line;
      }
    }
  }
  
  if (currentMessage) {
    messages.push(currentMessage);
  }
  
  return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}