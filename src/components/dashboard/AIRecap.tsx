'use client';

import { useState } from 'react';
import { AIRecapData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/ui/copy-button';
import { Calendar, Users, MessageSquare, Link, Sparkles, RefreshCw } from 'lucide-react';

interface AIRecapProps {
  aiRecaps: { [key: string]: AIRecapData };
  analysisId?: string;
  onRecapRegenerated?: (newRecaps: { [key: string]: AIRecapData }) => void;
}

export default function AIRecap({ aiRecaps, analysisId, onRecapRegenerated }: AIRecapProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState(7);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const timeRangeOptions = [
    { label: 'Last 1 Day', value: 1 },
    { label: 'Last 3 Days', value: 3 },
    { label: 'Last 7 Days', value: 7 },
    { label: 'Last 30 Days', value: 30 },
  ];

  const currentRecapData = aiRecaps[selectedTimeRange.toString()] || null;

  const getFullRecapText = () => {
    if (!currentRecapData) return '';
    
    const sections = [
      `Executive Summary (${currentRecapData.timeRange}):`,
      currentRecapData.summary,
      '',
      'Top Discussion Topics:',
      ...currentRecapData.topTopics.map(topic => `• ${topic}`),
      '',
      'Active Contributors:',
      currentRecapData.activeContributors.join(', '),
      '',
      'Key Decisions & Announcements:',
      ...currentRecapData.keyDecisions.map(decision => `• ${decision}`),
      '',
      'Important Resources:',
      ...currentRecapData.importantResources.map(resource => `• ${resource}`)
    ];
    
    return sections.filter(line => line !== undefined && line !== null).join('\n');
  };

  const getTopicsText = () => {
    return currentRecapData?.topTopics.map(topic => `• ${topic}`).join('\n') || '';
  };

  const getDecisionsText = () => {
    return currentRecapData?.keyDecisions.map(decision => `• ${decision}`).join('\n') || '';
  };

  const getResourcesText = () => {
    return currentRecapData?.importantResources.map(resource => `• ${resource}`).join('\n') || '';
  };

  const handleRegenerateRecap = async () => {
    if (!analysisId || !onRecapRegenerated) {
      alert('Regeneration not available - please refresh the page and try again.');
      return;
    }

    setIsRegenerating(true);
    try {
      const response = await fetch(`/api/analysis/${analysisId}/regenerate-recap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeRange: selectedTimeRange,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onRecapRegenerated(result.aiRecaps);
      } else {
        const error = await response.json();
        alert(`Failed to regenerate recap: ${error.error}`);
      }
    } catch (error) {
      console.error('Error regenerating recap:', error);
      alert('Failed to regenerate recap. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div className="w-full max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Time Range
          </label>
          <Select value={selectedTimeRange.toString()} onValueChange={(value) => setSelectedTimeRange(parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          {currentRecapData && (
            <CopyButton 
              text={getFullRecapText()} 
              showText 
              variant="secondary"
            />
          )}
          {analysisId && onRecapRegenerated && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerateRecap}
              disabled={isRegenerating}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
              {isRegenerating ? 'Regenerating...' : 'Regenerate'}
            </Button>
          )}
        </div>
      </div>

      {!currentRecapData && (
        <Card>
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
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Executive Summary</span>
                  <Badge variant="secondary">{currentRecapData.timeRange}</Badge>
                </div>
                <CopyButton text={currentRecapData.summary} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--text-primary)] leading-relaxed">{currentRecapData.summary}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5" />
                    <span>Top Discussion Topics</span>
                  </div>
                  {currentRecapData.topTopics.length > 0 && (
                    <CopyButton text={getTopicsText()} />
                  )}
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
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Key Decisions & Announcements</span>
                  </div>
                  {currentRecapData.keyDecisions.length > 0 && (
                    <CopyButton text={getDecisionsText()} />
                  )}
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
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Link className="w-5 h-5" />
                    <span>Important Resources</span>
                  </div>
                  {currentRecapData.importantResources.length > 0 && (
                    <CopyButton text={getResourcesText()} />
                  )}
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