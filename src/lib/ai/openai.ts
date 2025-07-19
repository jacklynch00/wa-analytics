import OpenAI from 'openai';
import { ParsedMessage, AIRecapData } from '@/types';
import { format, subDays } from 'date-fns';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateRecap(
  messages: ParsedMessage[],
  timeRangeDays: number
): Promise<AIRecapData> {
  const cutoffDate = subDays(new Date(), timeRangeDays);
  const filteredMessages = messages
    .filter(msg => msg.type !== 'system' && msg.timestamp >= cutoffDate)
    .slice(-100); // Limit to last 100 messages to avoid token limits
  
  if (filteredMessages.length === 0) {
    return {
      timeRange: `Last ${timeRangeDays} day${timeRangeDays > 1 ? 's' : ''}`,
      summary: 'No activity found in this time period.',
      topTopics: [],
      keyDecisions: [],
      activeContributors: [],
      importantResources: [],
    };
  }
  
  const messagesText = filteredMessages
    .map(msg => `${format(msg.timestamp, 'MMM dd, HH:mm')} - ${msg.author}: ${msg.content}`)
    .join('\n');
  
  const prompt = `Analyze this WhatsApp community chat data for the last ${timeRangeDays} day${timeRangeDays > 1 ? 's' : ''}:

${messagesText}

Generate a community recap in JSON format with the following structure:
{
  "summary": "2-3 sentence executive summary of key community activity",
  "topTopics": ["topic 1", "topic 2", "topic 3"],
  "keyDecisions": ["decision 1", "decision 2"],
  "activeContributors": ["member 1", "member 2", "member 3"],
  "importantResources": ["resource 1", "resource 2"]
}

Focus on:
- Main discussion themes and topics
- Important decisions, announcements, or consensus reached
- Most active and engaged members
- Valuable resources, tools, or links shared
- Keep responses concise and actionable`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Remove markdown code block formatting if present
    const cleanContent = content.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    
    const parsedResponse = JSON.parse(cleanContent);
    
    return {
      timeRange: `Last ${timeRangeDays} day${timeRangeDays > 1 ? 's' : ''}`,
      summary: parsedResponse.summary || 'No summary available.',
      topTopics: parsedResponse.topTopics || [],
      keyDecisions: parsedResponse.keyDecisions || [],
      activeContributors: parsedResponse.activeContributors || [],
      importantResources: parsedResponse.importantResources || [],
    };
  } catch (error) {
    console.error('Error generating AI recap:', error);
    
    return {
      timeRange: `Last ${timeRangeDays} day${timeRangeDays > 1 ? 's' : ''}`,
      summary: 'Unable to generate AI recap at this time.',
      topTopics: [],
      keyDecisions: [],
      activeContributors: [],
      importantResources: [],
    };
  }
}

export async function extractMentionedTools(messages: ParsedMessage[]): Promise<string[]> {
  const recentMessages = messages
    .filter(msg => msg.type === 'text')
    .slice(-50)
    .map(msg => msg.content)
    .join('\n');

  const prompt = `Analyze the following chat messages and extract any software tools, platforms, or applications mentioned:

${recentMessages}

Return a JSON array of tool names mentioned in the messages. Focus on:
- Software applications (e.g., "Slack", "Notion", "Figma")
- Development tools (e.g., "GitHub", "VS Code", "Docker")
- Platforms and services (e.g., "AWS", "Vercel", "OpenAI")
- Only include tools that are explicitly mentioned by name

Example response: ["Slack", "GitHub", "Figma", "OpenAI"]`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const tools = JSON.parse(content);
    return Array.isArray(tools) ? tools : [];
  } catch (error) {
    console.error('Error extracting tools:', error);
    return [];
  }
}