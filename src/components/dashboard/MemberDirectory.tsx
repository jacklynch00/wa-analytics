'use client';

import { useState } from 'react';
import { MemberProfile } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pagination, usePagination } from '@/components/ui/pagination';
import { Search, MessageCircle, Clock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface MemberDirectoryProps {
  members: MemberProfile[];
}

export default function MemberDirectory({ members }: MemberDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'totalMessages' | 'messageFrequency' | 'lastActive' | 'firstActive'>('totalMessages');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: typeof sortBy) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortOrder === 'desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />;
  };

  const filteredMembers = members
    .filter(member => 
      member.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'totalMessages':
          comparison = a.totalMessages - b.totalMessages;
          break;
        case 'messageFrequency':
          comparison = a.messageFrequency - b.messageFrequency;
          break;
        case 'lastActive':
          comparison = a.lastActive.getTime() - b.lastActive.getTime();
          break;
        case 'firstActive':
          comparison = a.firstActive.getTime() - b.firstActive.getTime();
          break;
        default:
          return 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const {
    currentItems: paginatedMembers,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    handlePageChange,
  } = usePagination(filteredMembers, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--text-secondary)]" />
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSort('name')}
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              sortBy === 'name'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
            }`}
          >
            Name {getSortIcon('name')}
          </button>
          
          <button
            onClick={() => handleSort('totalMessages')}
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              sortBy === 'totalMessages'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
            }`}
          >
            Messages {getSortIcon('totalMessages')}
          </button>
          
          <button
            onClick={() => handleSort('messageFrequency')}
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              sortBy === 'messageFrequency'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
            }`}
          >
            Frequency {getSortIcon('messageFrequency')}
          </button>
          
          <button
            onClick={() => handleSort('lastActive')}
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              sortBy === 'lastActive'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
            }`}
          >
            Last Active {getSortIcon('lastActive')}
          </button>
          
          <button
            onClick={() => handleSort('firstActive')}
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              sortBy === 'firstActive'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
            }`}
          >
            First Active {getSortIcon('firstActive')}
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {paginatedMembers.map((member) => (
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
        />
      )}

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