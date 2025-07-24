export interface ParsedMessage {
  timestamp: Date;
  author: string;
  content: string;
  type: 'text' | 'attachment' | 'system';
  attachmentInfo?: string;
}

export interface MemberProfile {
  name: string;
  totalMessages: number;
  firstActive: Date;
  lastActive: Date;
  messageFrequency: number;
  dailyActivity: { date: string; count: number }[];
  mostActiveHour: number;
  recentMessages: string[];
}

export interface Resource {
  url: string;
  title?: string;
  domain: string;
  sharedBy: string;
  dateShared: Date;
  context: string;
  category: 'link' | 'tool' | 'document';
}

export interface DailyActivity {
  date: string;
  messageCount: number;
  activeMembers: number;
}

export interface ChatAnalysis {
  id?: string;
  title?: string;
  messages: ParsedMessage[];
  members: MemberProfile[];
  dateRange: { start: Date; end: Date };
  resources: Resource[];
  dailyStats: DailyActivity[];
  totalMessages: number;
  activeMembersLast7Days: number;
  averageMessagesPerDay: number;
  hourlyDistribution: { hour: number; count: number }[];
  aiRecaps: { [key: string]: AIRecapData };
}

export interface AIRecapData {
  timeRange: string;
  summary: string;
  topTopics: string[];
  keyDecisions: string[];
  activeContributors: string[];
  importantResources: string[];
}