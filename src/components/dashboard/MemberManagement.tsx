'use client';

import { useState, useMemo } from 'react';
import { MemberProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, Filter, AlertTriangle, TrendingDown, Calendar, MessageCircle, Search } from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';

interface MemberManagementProps {
  members: MemberProfile[];
}

interface InactivityFilter {
  maxMessages: number;
  dateRangeDays: number;
}

export default function MemberManagement({ members }: MemberManagementProps) {
  const [filter, setFilter] = useState<InactivityFilter>({
    maxMessages: 5,
    dateRangeDays: 30,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'inactivity' | 'name' | 'lastActive'>('inactivity');

  const filteredAndSortedMembers = useMemo(() => {
    const cutoffDate = subDays(new Date(), filter.dateRangeDays);
    
    // Calculate inactivity score for each member
    const membersWithInactivity = members.map(member => {
      // Messages in the specified date range
      const recentMessages = member.dailyActivity.filter(day => 
        isAfter(new Date(day.date), cutoffDate)
      ).reduce((sum, day) => sum + day.count, 0);
      
      // Days since last activity
      const daysSinceLastActive = Math.floor(
        (new Date().getTime() - member.lastActive.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Calculate inactivity level
      const isInactive = recentMessages <= filter.maxMessages;
      const inactivityScore = recentMessages === 0 ? 1000 + daysSinceLastActive : 
                             isInactive ? 500 + daysSinceLastActive : 
                             daysSinceLastActive;
      
      return {
        ...member,
        recentMessages,
        daysSinceLastActive,
        isInactive,
        inactivityScore,
      };
    });

    // Filter by search term
    const searchFiltered = membersWithInactivity.filter(member =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort members
    const sorted = searchFiltered.sort((a, b) => {
      switch (sortBy) {
        case 'inactivity':
          return b.inactivityScore - a.inactivityScore;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'lastActive':
          return b.lastActive.getTime() - a.lastActive.getTime();
        default:
          return 0;
      }
    });

    return sorted;
  }, [members, filter, searchTerm, sortBy]);

  const stats = useMemo(() => {
    const inactiveMembers = filteredAndSortedMembers.filter(m => m.isInactive);
    const completelyInactive = filteredAndSortedMembers.filter(m => m.recentMessages === 0);
    
    return {
      totalMembers: members.length,
      inactiveMembers: inactiveMembers.length,
      completelyInactive: completelyInactive.length,
      activeMembers: members.length - inactiveMembers.length,
    };
  }, [filteredAndSortedMembers, members.length]);

  const getInactivityBadgeVariant = (member: { recentMessages: number; isInactive: boolean }) => {
    if (member.recentMessages === 0) return 'destructive';
    if (member.isInactive) return 'security';
    return 'secondary';
  };

  const getInactivityLabel = (member: { recentMessages: number; isInactive: boolean }) => {
    if (member.recentMessages === 0) return 'No Activity';
    if (member.isInactive) return 'Low Activity';
    return 'Active';
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stats-card">
          <CardContent className="p-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[var(--tag-nutrition-bg)] rounded-[var(--radius-medium)]">
                <Users className="w-5 h-5 text-[var(--brand)]" />
              </div>
              <div>
                <div className="card-value text-lg">{stats.totalMembers}</div>
                <div className="card-title">Total Members</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent className="p-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[var(--tag-security-bg)] rounded-[var(--radius-medium)]">
                <TrendingDown className="w-5 h-5 text-[var(--warning)]" />
              </div>
              <div>
                <div className="card-value text-lg">{stats.inactiveMembers}</div>
                <div className="card-title">Inactive Members</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent className="p-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-[var(--radius-medium)]">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="card-value text-lg">{stats.completelyInactive}</div>
                <div className="card-title">No Activity</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent className="p-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[var(--tag-streaming-bg)] rounded-[var(--radius-medium)]">
                <MessageCircle className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <div>
                <div className="card-value text-lg">{stats.activeMembers}</div>
                <div className="card-title">Active Members</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Inactivity Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="card-title block mb-2">Max Messages (Inactive)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={filter.maxMessages}
                onChange={(e) => setFilter(prev => ({ ...prev, maxMessages: parseInt(e.target.value) || 0 }))}
                placeholder="e.g., 5"
              />
            </div>
            
            <div>
              <label className="card-title block mb-2">Date Range (Days)</label>
              <select
                value={filter.dateRangeDays}
                onChange={(e) => setFilter(prev => ({ ...prev, dateRangeDays: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-[var(--radius-medium)] focus:outline-[var(--focus-outline)] focus:outline-offset-[var(--focus-offset)] text-[var(--text-primary)] bg-[var(--card-bg)]"
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={60}>Last 60 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>

            <div>
              <label className="card-title block mb-2">Search Members</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--text-secondary)]" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="card-title block mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'inactivity' | 'name' | 'lastActive')}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-[var(--radius-medium)] focus:outline-[var(--focus-outline)] focus:outline-offset-[var(--focus-offset)] text-[var(--text-primary)] bg-[var(--card-bg)]"
              >
                <option value="inactivity">Inactivity Level</option>
                <option value="name">Name</option>
                <option value="lastActive">Last Active</option>
              </select>
            </div>
          </div>

          <div className="mt-4 p-3 bg-[var(--card-hover-bg)] rounded-[var(--radius-medium)]">
            <div className="text-sm text-[var(--text-secondary)]">
              <strong>Current Filter:</strong> Members with ≤{filter.maxMessages} messages in the last {filter.dateRangeDays} days are considered inactive.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Member Activity Status</span>
            <div className="flex items-center space-x-4 text-sm font-normal">
              <Badge variant="destructive">{filteredAndSortedMembers.filter(m => m.recentMessages === 0).length} No Activity</Badge>
              <Badge variant="security">{filteredAndSortedMembers.filter(m => m.isInactive && m.recentMessages > 0).length} Low Activity</Badge>
              <Badge variant="secondary">{filteredAndSortedMembers.filter(m => !m.isInactive).length} Active</Badge>
              <span className="text-[var(--text-secondary)]">({filteredAndSortedMembers.length} total)</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredAndSortedMembers.map((member) => (
              <div
                key={member.name}
                className={`activity-card p-4 ${
                  member.recentMessages === 0 ? 'border-l-4 border-l-red-500' :
                  member.isInactive ? 'border-l-4 border-l-orange-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-[var(--tag-nutrition-bg)] rounded-full flex items-center justify-center">
                      <span className="text-[var(--brand)] font-semibold">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-[var(--text-primary)]">{member.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-[var(--text-secondary)]">
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>{member.recentMessages} recent messages</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Last active: {format(member.lastActive, 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right text-sm">
                      <div className="text-[var(--text-secondary)]">
                        {member.daysSinceLastActive} days ago
                      </div>
                      <div className="font-medium text-[var(--text-primary)]">
                        {member.totalMessages} total
                      </div>
                    </div>
                    
                    <Badge variant={getInactivityBadgeVariant(member)}>
                      {getInactivityLabel(member)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAndSortedMembers.length === 0 && (
            <div className="text-center py-8 text-[var(--text-secondary)]">
              No members found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}