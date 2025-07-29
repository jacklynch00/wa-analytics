'use client';

import { useParams } from 'next/navigation';
import FormResponsesTab from '@/components/community/FormResponsesTab';
import { useEffect, useState } from 'react';
import { ApplicationForm } from '@prisma/client';
import { FormQuestion } from '@/types';

export default function CommunityResponsesPage() {
	const params = useParams();
	const communityId = params.communityId as string;
	const [applicationForm, setApplicationForm] = useState<(ApplicationForm & { questions: FormQuestion[]; _count: { applications: number } }) | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadData = async () => {
			try {
				const communityResponse = await fetch(`/api/communities/${communityId}`);
				if (communityResponse.ok) {
					const result = await communityResponse.json();
					if (result.community.applicationForm) {
						setApplicationForm(result.community.applicationForm);
					}
				}
			} catch (error) {
				console.error('Error loading community data:', error);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [communityId]);

	if (loading) {
		return (
			<div className='flex items-center justify-center py-8'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			<FormResponsesTab communityId={communityId} applicationForm={applicationForm} />
		</div>
	);
}
