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

export type QuestionType = 'text' | 'multiple_choice' | 'multiple_select';

export interface FormQuestion {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'DENIED';

export interface ApplicationFormData {
  id: string;
  communityId: string;
  title: string;
  description?: string;
  isActive: boolean;
  isPublic: boolean;
  password?: string;
  customSlug: string;
  whatsappInviteUrl?: string;
  acceptanceMessage?: string;
  denialMessage?: string;
  questions: FormQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MemberApplicationData {
  id: string;
  formId: string;
  email: string;
  responses: Record<string, any>;
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  invitedAt?: Date;
}