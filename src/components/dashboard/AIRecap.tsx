'use client';

import { useState } from 'react';
import { AIRecapData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, MessageSquare, Link, Sparkles, Loader2 } from 'lucide-react';

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
        <Card className="border-orange-200">
          <CardContent className="p-6">
            <div className="text-orange-600 text-center">
              <p className="font-medium">No recap available for this time range</p>
              <p className="text-sm mt-1">This recap was not generated during the initial analysis.</p>
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
              <p className="text-gray-700 leading-relaxed">{currentRecapData.summary}</p>
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
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-700">{topic}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">No significant topics identified</p>
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
                  <p className="text-gray-500 italic">No active contributors identified</p>
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
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-700">{decision}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">No key decisions identified</p>
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
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-700">{resource}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">No important resources identified</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}