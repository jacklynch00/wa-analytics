import { ParsedMessage, MemberProfile } from '@/types';
import { format, differenceInDays } from 'date-fns';

export function analyzeMemberActivity(messages: ParsedMessage[]): MemberProfile[] {
  const memberMap = new Map<string, {
    messages: ParsedMessage[];
    dailyCount: Map<string, number>;
    hourlyCount: Map<number, number>;
  }>();

  messages
    .filter(msg => msg.type !== 'system')
    .forEach(msg => {
      if (!memberMap.has(msg.author)) {
        memberMap.set(msg.author, {
          messages: [],
          dailyCount: new Map(),
          hourlyCount: new Map(),
        });
      }

      const memberData = memberMap.get(msg.author)!;
      memberData.messages.push(msg);

      const dateKey = format(msg.timestamp, 'yyyy-MM-dd');
      memberData.dailyCount.set(dateKey, (memberData.dailyCount.get(dateKey) || 0) + 1);

      const hour = msg.timestamp.getHours();
      memberData.hourlyCount.set(hour, (memberData.hourlyCount.get(hour) || 0) + 1);
    });

  return Array.from(memberMap.entries()).map(([name, data]) => {
    const sortedMessages = data.messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const firstActive = sortedMessages[0].timestamp;
    const lastActive = sortedMessages[sortedMessages.length - 1].timestamp;
    const daysBetween = differenceInDays(lastActive, firstActive) || 1;
    
    const mostActiveHour = Array.from(data.hourlyCount.entries())
      .reduce((max, [hour, count]) => count > max.count ? { hour, count } : max, { hour: 0, count: 0 })
      .hour;

    const dailyActivity = Array.from(data.dailyCount.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const recentMessages = sortedMessages
      .slice(-3)
      .map(msg => msg.content.substring(0, 100))
      .filter(content => content.length > 0);

    return {
      name,
      totalMessages: data.messages.length,
      firstActive,
      lastActive,
      messageFrequency: data.messages.length / daysBetween,
      dailyActivity,
      mostActiveHour,
      recentMessages,
    };
  }).sort((a, b) => b.totalMessages - a.totalMessages);
}