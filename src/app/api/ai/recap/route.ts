import { NextRequest, NextResponse } from 'next/server';
import { generateRecap } from '@/lib/ai/openai';
import { ParsedMessage } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { messages, timeRangeDays } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages data' },
        { status: 400 }
      );
    }

    const parsedMessages: ParsedMessage[] = messages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));

    const recap = await generateRecap(parsedMessages, timeRangeDays || 7);

    return NextResponse.json(recap);
  } catch (error) {
    console.error('Error generating recap:', error);
    return NextResponse.json(
      { error: 'Failed to generate recap' },
      { status: 500 }
    );
  }
}