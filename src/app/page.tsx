'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from '@/components/upload/FileUpload';
import LoadingScreen from '@/components/upload/LoadingScreen';
import { parseWhatsAppExport } from '@/lib/parsers/whatsapp';
import { analyzeMemberActivity } from '@/lib/analyzers/members';
import { extractResources } from '@/lib/analyzers/resources';
import { generateDailyStats, generateHourlyDistribution, getActiveMembersInPeriod } from '@/lib/analyzers/timeseries';
import { ChatAnalysis, AIRecapData } from '@/types';

export default function HomePage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);

    try {
      const fileContent = await file.text();
      
      setTimeout(async () => {
        try {
          const messages = parseWhatsAppExport(fileContent);
          const members = analyzeMemberActivity(messages);
          const resources = extractResources(messages);
          const dailyStats = generateDailyStats(messages);
          const hourlyDistribution = generateHourlyDistribution(messages);
          const activeMembersLast7Days = getActiveMembersInPeriod(messages, 7);
          
          const dateRange = {
            start: messages[0]?.timestamp || new Date(),
            end: messages[messages.length - 1]?.timestamp || new Date(),
          };

          // Generate AI recaps for different time ranges
          const aiRecaps: { [key: string]: AIRecapData } = {};
          const timeRanges = [1, 3, 7, 30];
          
          for (const days of timeRanges) {
            try {
              const response = await fetch('/api/ai/recap', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  messages,
                  timeRangeDays: days,
                }),
              });
              
              if (response.ok) {
                const recap = await response.json();
                aiRecaps[days.toString()] = recap;
              }
            } catch (error) {
              console.warn(`Failed to generate ${days}-day recap:`, error);
              // Continue with other time ranges even if one fails
            }
          }

          const analysis: ChatAnalysis = {
            messages,
            members,
            resources,
            dailyStats,
            dateRange,
            totalMessages: messages.filter(m => m.type !== 'system').length,
            activeMembersLast7Days,
            averageMessagesPerDay: dailyStats.length > 0 
              ? dailyStats.reduce((sum, day) => sum + day.messageCount, 0) / dailyStats.length
              : 0,
            hourlyDistribution,
            aiRecaps,
          };

          sessionStorage.setItem('chatAnalysis', JSON.stringify(analysis, (key, value) => {
            if (key === 'timestamp' || key === 'firstActive' || key === 'lastActive' || key === 'dateShared' || key === 'start' || key === 'end') {
              return value instanceof Date ? value.toISOString() : value;
            }
            return value;
          }));

          router.push('/results');
        } catch (error) {
          console.error('Error processing file:', error);
          setIsProcessing(false);
          alert('Error processing file. Please check the file format and try again.');
        }
      }, 100);
    } catch (error) {
      console.error('Error reading file:', error);
      setIsProcessing(false);
      alert('Error reading file. Please try again.');
    }
  };

  if (isProcessing) {
    return <LoadingScreen onComplete={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-[var(--container-bg)]">
      <FileUpload onFileSelect={handleFileSelect} />
    </div>
  );
}