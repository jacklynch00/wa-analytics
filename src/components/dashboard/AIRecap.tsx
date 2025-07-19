'use client';

import { useState } from 'react';
import { AIRecapData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, MessageSquare, Link, Sparkles } from 'lucide-react';

interface AIRecapProps {
  aiRecaps: { [key: string]: AIRecapData };
}

export default function AIRecap({ aiRecaps }: AIRecapProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState(7);

  const timeRangeOptions = [
    { label: 'Last 1 Day', value: 1 },
    { label: 'Last 3 Days', value: 3 },
    { label: 'Last 7 Days', value: 7 },
    { label: 'Last 30 Days', value: 30 },
  ];

  const currentRecapData = aiRecaps[selectedTimeRange.toString()] || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {timeRangeOptions.map((option) => (
          <Button
            key={option.value}
            variant={selectedTimeRange === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeRange(option.value)}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {option.label}
          </Button>
        ))}
      </div>

      {!currentRecapData && (
        <Card className="border-[var(--tag-security-border)]">
          <CardContent className="p-6">
            <div className="text-[var(--warning)] text-center">
              <p className="font-medium">No recap available for this time range</p>
              <p className="text-sm mt-1 text-[var(--text-secondary)]">This recap was not generated during the initial analysis.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {currentRecapData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5" />
                <span>Executive Summary</span>
                <Badge variant="secondary">{currentRecapData.timeRange}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--text-primary)] leading-relaxed">{currentRecapData.summary}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Top Discussion Topics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentRecapData.topTopics.length > 0 ? (
                  <ul className="space-y-2">
                    {currentRecapData.topTopics.map((topic, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-[var(--brand)] rounded-full mt-2 flex-shrink-0" />
                        <span className="text-[var(--text-primary)]">{topic}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[var(--text-secondary)] italic">No significant topics identified</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Active Contributors</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentRecapData.activeContributors.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {currentRecapData.activeContributors.map((contributor, index) => (
                      <Badge key={index} variant="outline">
                        {contributor}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-[var(--text-secondary)] italic">No active contributors identified</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Key Decisions & Announcements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentRecapData.keyDecisions.length > 0 ? (
                  <ul className="space-y-2">
                    {currentRecapData.keyDecisions.map((decision, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-[var(--accent)] rounded-full mt-2 flex-shrink-0" />
                        <span className="text-[var(--text-primary)]">{decision}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[var(--text-secondary)] italic">No key decisions identified</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Link className="w-5 h-5" />
                  <span>Important Resources</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentRecapData.importantResources.length > 0 ? (
                  <ul className="space-y-2">
                    {currentRecapData.importantResources.map((resource, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-[var(--chart-nutrition)] rounded-full mt-2 flex-shrink-0" />
                        <span className="text-[var(--text-primary)]">{resource}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[var(--text-secondary)] italic">No important resources identified</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}