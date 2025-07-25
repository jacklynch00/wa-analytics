import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { uploadFileSecurely } from '@/lib/storage-secure';
import { parseWhatsAppExport } from '@/lib/parsers/whatsapp';
import { analyzeMemberActivity } from '@/lib/analyzers/members';
import { extractResources } from '@/lib/analyzers/resources';
import { generateDailyStats, generateHourlyDistribution, getActiveMembersInPeriod } from '@/lib/analyzers/timeseries';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
	try {
		// Check authentication
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = session.user.id;

		// Parse form data
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const communityId = formData.get('communityId') as string;

		if (!communityId) {
			return NextResponse.json({ error: 'Community ID is required' }, { status: 400 });
		}

		// Verify the community belongs to the user
		const community = await prisma.community.findFirst({
			where: {
				id: communityId,
				userId,
			},
		});

		if (!community) {
			return NextResponse.json({ error: 'Community not found' }, { status: 404 });
		}

		// Check upload limit
		const existingAnalyses = await prisma.chatAnalysis.count({
			where: { userId },
		});

		if (existingAnalyses >= 3) {
			return NextResponse.json({ error: 'Upload limit reached. You can only have 3 analyses per account.' }, { status: 403 });
		}

		if (!file) {
			return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
		}

		// Read file content
		const fileContent = await file.text();

		// Parse WhatsApp export
		const messages = parseWhatsAppExport(fileContent);
		if (messages.length === 0) {
			return NextResponse.json({ error: 'Invalid WhatsApp export file' }, { status: 400 });
		}

		// Analyze data
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
		const aiRecaps: { [key: string]: unknown } = {};
		const timeRanges = [1, 3, 7, 30];

		for (const days of timeRanges) {
			try {
				const response = await fetch(`${process.env.BETTER_AUTH_URL}/api/ai/recap`, {
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
			}
		}

		// Upload file to R2
		let fileUrl: string | null = null;
		try {
			const fileBuffer = Buffer.from(fileContent);
			fileUrl = await uploadFileSecurely(fileBuffer, userId, file.name, 'text/plain');
		} catch (error) {
			console.warn('Failed to upload file to R2:', error);
		}

		// Prepare analysis data
		const analysisData = {
			members,
			resources,
			dailyStats,
			hourlyDistribution,
			aiRecaps,
			messages: messages.slice(0, 1000), // Store only first 1000 messages to avoid size limits
		};

		// Save to database
		const chatAnalysis = await prisma.chatAnalysis.create({
			data: {
				userId,
				communityId,
				title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
				fileName: file.name,
				fileUrl,
				totalMessages: messages.filter((m) => m.type !== 'system').length,
				totalMembers: members.length,
				dateRange: JSON.parse(
					JSON.stringify(dateRange, (key, value) => {
						if (key === 'start' || key === 'end') {
							return value instanceof Date ? value.toISOString() : value;
						}
						return value;
					})
				),
				analysisData: JSON.parse(
					JSON.stringify(analysisData, (key, value) => {
						if (key === 'timestamp' || key === 'firstActive' || key === 'lastActive' || key === 'dateShared' || key === 'start' || key === 'end') {
							return value instanceof Date ? value.toISOString() : value;
						}
						return value;
					})
				),
			},
		});

		// Return analysis data for immediate use
		const fullAnalysisData = {
			id: chatAnalysis.id,
			messages,
			members,
			resources,
			dailyStats,
			dateRange,
			totalMessages: messages.filter((m) => m.type !== 'system').length,
			activeMembersLast7Days,
			averageMessagesPerDay: dailyStats.length > 0 ? dailyStats.reduce((sum, day) => sum + day.messageCount, 0) / dailyStats.length : 0,
			hourlyDistribution,
			aiRecaps,
		};

		return NextResponse.json({
			success: true,
			analysisId: chatAnalysis.id,
			analysis: fullAnalysisData,
		});
	} catch (error) {
		console.error('Upload error:', error);
		return NextResponse.json({ error: 'Failed to process upload' }, { status: 500 });
	}
}
