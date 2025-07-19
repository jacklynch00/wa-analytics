'use client';

import { useState, useMemo } from 'react';
import { ChatAnalysis } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users, Calendar, TrendingUp, Clock, BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, subDays, isAfter } from 'date-fns';

interface AnalyticsProps {
  analysis: ChatAnalysis;
}

export default function Analytics({ analysis }: AnalyticsProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'all' | 7 | 14 | 30 | 90>('all');
  
  const timeRangeOptions = [
    { label: 'All Time', value: 'all' as const },
    { label: 'Last 7 Days', value: 7 as const },
    { label: 'Last 14 Days', value: 14 as const },
    { label: 'Last 30 Days', value: 30 as const },
    { label: 'Last 90 Days', value: 90 as const },
  ];

  const filteredData = useMemo(() => {
    if (selectedTimeRange === 'all') {
      return {
        dailyStats: analysis.dailyStats,
        hourlyDistribution: analysis.hourlyDistribution,
        messages: analysis.messages
      };
    }

    const cutoffDate = subDays(new Date(), selectedTimeRange);
    
    const filteredDailyStats = analysis.dailyStats.filter(day => 
      isAfter(parseISO(day.date), cutoffDate) || day.date === format(cutoffDate, 'yyyy-MM-dd')
    );

    const filteredMessages = analysis.messages.filter(msg => 
      msg.type !== 'system' && isAfter(msg.timestamp, cutoffDate)
    );

    // Recalculate hourly distribution for filtered messages
    const hourlyCount = new Map<number, number>();
    for (let i = 0; i < 24; i++) {
      hourlyCount.set(i, 0);
    }
    
    filteredMessages.forEach(msg => {
      const hour = msg.timestamp.getHours();
      hourlyCount.set(hour, (hourlyCount.get(hour) || 0) + 1);
    });

    const filteredHourlyDistribution = Array.from(hourlyCount.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour - b.hour);

    return {
      dailyStats: filteredDailyStats,
      hourlyDistribution: filteredHourlyDistribution,
      messages: filteredMessages
    };
  }, [selectedTimeRange, analysis]);

  const formatChartDate = (dateStr: string) => {
    return format(parseISO(dateStr), 'MMM dd');
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const topContributors = analysis.members.slice(0, 5);
  const peakHour = analysis.hourlyDistribution.reduce((max, current) => 
    current.count > max.count ? current : max, analysis.hourlyDistribution[0]
  );

  const totalDays = analysis.dailyStats.length;
  const mostActiveDay = analysis.dailyStats.reduce((max, current) =>
    current.messageCount > max.messageCount ? current : max, analysis.dailyStats[0]
  );

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Time Range Filter</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {timeRangeOptions.map((option) => (
              <Button
                key={option.value}
                variant={selectedTimeRange === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeRange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          {selectedTimeRange !== 'all' && (
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              Showing data from {format(subDays(new Date(), selectedTimeRange), 'MMM dd, yyyy')} to {format(new Date(), 'MMM dd, yyyy')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stats-card">
          <CardContent className="p-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[var(--tag-nutrition-bg)] rounded-[var(--radius-medium)]">
                <MessageCircle className="w-5 h-5 text-[var(--brand)]" />
              </div>
              <div>
                <div className="card-value text-lg">{analysis.totalMessages.toLocaleString()}</div>
                <div className="card-title">Total Messages</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent className="p-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[var(--tag-streaming-bg)] rounded-[var(--radius-medium)]">
                <Users className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <div>
                <div className="card-value text-lg">{analysis.activeMembersLast7Days}</div>
                <div className="card-title">Active Members (7d)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent className="p-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[var(--tag-food-bg)] rounded-[var(--radius-medium)]">
                <Calendar className="w-5 h-5 text-[var(--chart-nutrition)]" />
              </div>
              <div>
                <div className="card-value text-lg">{totalDays}</div>
                <div className="card-title">Days Analyzed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent className="p-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[var(--tag-security-bg)] rounded-[var(--radius-medium)]">
                <TrendingUp className="w-5 h-5 text-[var(--warning)]" />
              </div>
              <div>
                <div className="card-value text-lg">{analysis.averageMessagesPerDay.toFixed(1)}</div>
                <div className="card-title">Avg Messages/Day</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Daily Message Volume</span>
              </div>
              {selectedTimeRange !== 'all' && (
                <Badge variant="secondary">{timeRangeOptions.find(opt => opt.value === selectedTimeRange)?.label}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={filteredData.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatChartDate}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => formatChartDate(value as string)}
                  formatter={(value: number) => [value, 'Messages']}
                />
                <Line 
                  type="monotone" 
                  dataKey="messageCount" 
                  stroke="#4285F4" 
                  strokeWidth={2}
                  dot={{ fill: '#4285F4', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Messages by Hour</span>
              </div>
              {selectedTimeRange !== 'all' && (
                <Badge variant="secondary">{timeRangeOptions.find(opt => opt.value === selectedTimeRange)?.label}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredData.hourlyDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={formatHour}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => formatHour(value as number)}
                  formatter={(value: number) => [value, 'Messages']}
                />
                <Bar dataKey="count" fill="#34A853" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Contributors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Top Contributors</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topContributors.map((member, index) => (
              <div key={member.name} className="activity-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                      index === 0 ? 'bg-[var(--chart-food)]' : 
                      index === 1 ? 'bg-[var(--neutral)]' : 
                      index === 2 ? 'bg-[var(--warning)]' : 'bg-[var(--brand)]'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-[var(--text-primary)]">{member.name}</div>
                      <div className="text-sm text-[var(--text-secondary)]">
                        {member.messageFrequency.toFixed(1)} messages/day
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {member.totalMessages} messages
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Activity Patterns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-secondary)]">Peak Activity Hour</span>
              <Badge variant="outline">
                {formatHour(peakHour.hour)} ({peakHour.count} messages)
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-secondary)]">Most Active Day</span>
              <Badge variant="outline">
                {formatChartDate(mostActiveDay.date)} ({mostActiveDay.messageCount} messages)
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-secondary)]">Total Members</span>
              <Badge variant="outline">
                {analysis.members.length} members
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-secondary)]">Chat Duration</span>
              <Badge variant="outline">
                {totalDays} days
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-[var(--text-secondary)] space-y-2">
              <p>
                <strong className="text-[var(--text-primary)]">Most Active Hour:</strong> {formatHour(peakHour.hour)} with {peakHour.count} messages
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">Daily Average:</strong> {analysis.averageMessagesPerDay.toFixed(1)} messages per day
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">Recent Activity:</strong> {analysis.activeMembersLast7Days} members active in the last 7 days
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">Top Contributor:</strong> {topContributors[0]?.name} with {topContributors[0]?.totalMessages} messages
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}