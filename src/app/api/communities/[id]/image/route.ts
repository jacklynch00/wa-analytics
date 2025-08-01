import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { OrganizationService } from '@/lib/services/organization';
import { uploadFileSecurely } from '@/lib/storage-secure';

const prisma = new PrismaClient();

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id: communityId } = await params;
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check if user can access the community
		const organization = await OrganizationService.getUserOrganization(session.user.id);
		if (!organization) {
			return NextResponse.json({ error: 'No organization found' }, { status: 404 });
		}

		const community = await prisma.community.findFirst({
			where: {
				id: communityId,
				organizationId: organization.id,
			},
		});

		if (!community) {
			return NextResponse.json({ error: 'Community not found' }, { status: 404 });
		}

		// Parse form data
		const formData = await request.formData();
		const file = formData.get('image') as File;

		if (!file) {
			return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
		}

		// Validate file type
		const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
		if (!allowedTypes.includes(file.type)) {
			return NextResponse.json(
				{
					error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
				},
				{ status: 400 }
			);
		}

		// Validate file size (5MB limit)
		const maxSize = 5 * 1024 * 1024; // 5MB
		if (file.size > maxSize) {
			return NextResponse.json(
				{
					error: 'File size too large. Please upload an image smaller than 5MB.',
				},
				{ status: 400 }
			);
		}

		// Convert file to buffer
		const buffer = Buffer.from(await file.arrayBuffer());

		// Upload to R2 with secure key
		const fileKey = await uploadFileSecurely(buffer, session.user.id, file.name, file.type);

		// Update community with image URL
		await prisma.community.update({
			where: { id: communityId },
			data: { imageUrl: fileKey },
		});

		// Fetch updated community with all relations
		const updatedCommunity = await prisma.community.findFirst({
			where: { id: communityId },
			include: {
				chatAnalyses: {
					orderBy: { createdAt: 'desc' },
					select: {
						id: true,
						title: true,
						totalMessages: true,
						totalMembers: true,
						createdAt: true,
					},
				},
				memberDirectories: {
					where: { isActive: true },
					select: {
						id: true,
						password: true,
						isActive: true,
						visibleFields: true,
						createdAt: true,
					},
				},
				applicationForm: {
					select: {
						id: true,
						title: true,
						customSlug: true,
						isActive: true,
						isPublic: true,
						createdAt: true,
						questions: true,
						_count: {
							select: {
								applications: true,
							},
						},
					},
				},
				_count: {
					select: {
						chatAnalyses: true,
					},
				},
			},
		});

		return NextResponse.json({
			success: true,
			imageUrl: fileKey,
			community: updatedCommunity,
		});
	} catch (error) {
		console.error('Error uploading community image:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id: communityId } = await params;
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check if user can access the community
		const organization = await OrganizationService.getUserOrganization(session.user.id);
		if (!organization) {
			return NextResponse.json({ error: 'No organization found' }, { status: 404 });
		}

		const community = await prisma.community.findFirst({
			where: {
				id: communityId,
				organizationId: organization.id,
			},
		});

		if (!community) {
			return NextResponse.json({ error: 'Community not found' }, { status: 404 });
		}

		// Remove image URL from community
		await prisma.community.update({
			where: { id: communityId },
			data: { imageUrl: null },
		});

		// Fetch updated community with all relations
		const updatedCommunity = await prisma.community.findFirst({
			where: { id: communityId },
			include: {
				chatAnalyses: {
					orderBy: { createdAt: 'desc' },
					select: {
						id: true,
						title: true,
						totalMessages: true,
						totalMembers: true,
						createdAt: true,
					},
				},
				memberDirectories: {
					where: { isActive: true },
					select: {
						id: true,
						password: true,
						isActive: true,
						visibleFields: true,
						createdAt: true,
					},
				},
				applicationForm: {
					select: {
						id: true,
						title: true,
						customSlug: true,
						isActive: true,
						isPublic: true,
						createdAt: true,
						questions: true,
						_count: {
							select: {
								applications: true,
							},
						},
					},
				},
				_count: {
					select: {
						chatAnalyses: true,
					},
				},
			},
		});

		return NextResponse.json({
			success: true,
			community: updatedCommunity,
		});
	} catch (error) {
		console.error('Error removing community image:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
