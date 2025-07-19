'use client';

import { useState } from 'react';
import { MemberProfile } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, MessageCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { linkifyText } from '@/lib/linkify';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface MemberDirectoryProps {
  members: MemberProfile[];
}

export default function MemberDirectory({ members }: MemberDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'totalMessages' | 'messageFrequency' | 'lastActive'>('totalMessages');
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);

  const filteredMembers = members
    .filter(member => 
      member.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'totalMessages':
          return b.totalMessages - a.totalMessages;
        case 'messageFrequency':
          return b.messageFrequency - a.messageFrequency;
        case 'lastActive':
          return b.lastActive.getTime() - a.lastActive.getTime();
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--text-secondary)]" />
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'totalMessages' | 'messageFrequency' | 'lastActive')}
          className="px-3 py-2 border border-[var(--border)] rounded-[var(--radius-medium)] focus:outline-[var(--focus-outline)] focus:outline-offset-[var(--focus-offset)] text-[var(--text-primary)] bg-[var(--card-bg)]"
        >
          <option value="totalMessages">Sort by Total Messages</option>
          <option value="messageFrequency">Sort by Frequency</option>
          <option value="lastActive">Sort by Last Active</option>
        </select>
      </div>

      <div className="grid gap-4">
        {filteredMembers.map((member) => (
          <Card 
            key={member.name}
            className="cursor-pointer hover:shadow-[var(--shadow-hover)] transition-shadow"
            onClick={() => setSelectedMember(selectedMember?.name === member.name ? null : member)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-[var(--tag-nutrition-bg)] rounded-full flex items-center justify-center">
                    <span className="text-[var(--brand)] font-semibold">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">{member.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-[var(--text-secondary)]">
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>{member.totalMessages} messages</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{member.messageFrequency.toFixed(1)}/day</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-[var(--text-secondary)]">Last active</div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    {format(member.lastActive, 'MMM dd, yyyy')}
                  </div>
                </div>
              </div>

              {selectedMember?.name === member.name && (
                <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium text-[var(--text-primary)] mb-2">Activity Timeline</h4>
                      <div className="text-sm text-[var(--text-secondary)]">
                        <div>First active: {format(member.firstActive, 'MMM dd, yyyy')}</div>
                        <div>Most active hour: {member.mostActiveHour}:00</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-[var(--text-primary)] mb-2">Recent Activity (Last 7 Days)</h4>
                      <div className="h-24 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={member.dailyActivity.slice(-7).map(day => ({
                            date: format(new Date(day.date), 'MMM dd'),
                            count: day.count
                          }))}>
                            <XAxis 
                              dataKey="date" 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                            />
                            <YAxis 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                              width={20}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="count" 
                              stroke="#4285F4" 
                              strokeWidth={2}
                              dot={{ fill: '#4285F4', strokeWidth: 0, r: 3 }}
                              activeDot={{ r: 4, fill: '#4285F4' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-[var(--text-primary)] mb-2">Recent Messages</h4>
                      <div className="space-y-2">
                        {member.recentMessages.slice(0, 2).map((message, index) => (
                          <div key={index} className="text-xs text-[var(--text-secondary)] bg-[var(--card-hover-bg)] p-2 rounded-[var(--radius-small)]">
                            &ldquo;{linkifyText(message.length > 80 ? message.substring(0, 80) + '...' : message)}&rdquo;
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-[var(--text-secondary)]">
              No members found matching &ldquo;{searchTerm}&rdquo;
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}