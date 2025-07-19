import { ParsedMessage, DailyActivity } from '@/types';
import { format, eachDayOfInterval, subDays } from 'date-fns';

export function generateDailyStats(messages: ParsedMessage[]): DailyActivity[] {
  if (messages.length === 0) return [];
  
  const nonSystemMessages = messages.filter(msg => msg.type !== 'system');
  const sortedMessages = nonSystemMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  const startDate = sortedMessages[0].timestamp;
  const endDate = sortedMessages[sortedMessages.length - 1].timestamp;
  
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  
  const dailyStats = new Map<string, { messageCount: number; activeMembers: Set<string> }>();
  
  // Initialize all days
  allDays.forEach(day => {
    const dateKey = format(day, 'yyyy-MM-dd');
    dailyStats.set(dateKey, { messageCount: 0, activeMembers: new Set() });
  });
  
  // Populate with actual data
  nonSystemMessages.forEach(msg => {
    const dateKey = format(msg.timestamp, 'yyyy-MM-dd');
    const dayStats = dailyStats.get(dateKey);
    if (dayStats) {
      dayStats.messageCount++;
      dayStats.activeMembers.add(msg.author);
    }
  });
  
  return Array.from(dailyStats.entries())
    .map(([date, stats]) => ({
      date,
      messageCount: stats.messageCount,
      activeMembers: stats.activeMembers.size,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function generateHourlyDistribution(messages: ParsedMessage[]): { hour: number; count: number }[] {
  const hourlyCount = new Map<number, number>();
  
  // Initialize all hours
  for (let i = 0; i < 24; i++) {
    hourlyCount.set(i, 0);
  }
  
  messages
    .filter(msg => msg.type !== 'system')
    .forEach(msg => {
      const hour = msg.timestamp.getHours();
      hourlyCount.set(hour, (hourlyCount.get(hour) || 0) + 1);
    });
  
  return Array.from(hourlyCount.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour - b.hour);
}

export function getActiveMembersInPeriod(messages: ParsedMessage[], days: number): number {
  const cutoffDate = subDays(new Date(), days);
  const activeMembers = new Set<string>();
  
  messages
    .filter(msg => msg.type !== 'system' && msg.timestamp >= cutoffDate)
    .forEach(msg => activeMembers.add(msg.author));
  
  return activeMembers.size;
}