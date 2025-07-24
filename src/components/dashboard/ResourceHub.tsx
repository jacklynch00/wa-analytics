'use client';

import { useState } from 'react';
import { Resource } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination, usePagination } from '@/components/ui/pagination';
import { CopyButton } from '@/components/ui/copy-button';
import { Search, ExternalLink, Calendar, User, Filter, FileText, Link2, Wrench, File } from 'lucide-react';
import { WebsiteIcon } from '@/components/ui/website-icon';
import { format } from 'date-fns';
import { linkifyText } from '@/lib/linkify';

interface ResourceHubProps {
	resources: Resource[];
}

export default function ResourceHub({ resources }: ResourceHubProps) {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<'all' | 'link' | 'tool' | 'document'>('all');
	const [sortBy, setSortBy] = useState<'date' | 'domain'>('date');

	const categoryColors = {
		link: 'bg-[var(--tag-nutrition-bg)] text-[var(--brand)]',
		tool: 'bg-[var(--tag-streaming-bg)] text-[var(--accent)]',
		document: 'bg-[var(--tag-food-bg)] text-[var(--chart-nutrition)]',
	};

	const filteredResources = resources
		.filter((resource) => {
			const matchesSearch =
				resource.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
				resource.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
				resource.context.toLowerCase().includes(searchTerm.toLowerCase()) ||
				resource.sharedBy.toLowerCase().includes(searchTerm.toLowerCase());

			const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;

			return matchesSearch && matchesCategory;
		})
		.sort((a, b) => {
			if (sortBy === 'date') {
				return b.dateShared.getTime() - a.dateShared.getTime();
			} else {
				return a.domain.localeCompare(b.domain);
			}
		});

	const { currentItems: paginatedResources, currentPage, totalPages, totalItems, itemsPerPage, handlePageChange } = usePagination(filteredResources, 8);

	const categoryStats = {
		all: resources.length,
		link: resources.filter((r) => r.category === 'link').length,
		tool: resources.filter((r) => r.category === 'tool').length,
		document: resources.filter((r) => r.category === 'document').length,
	};

	return (
		<div className='space-y-6'>
			{/* Resource Summary Metrics */}
			{resources.length > 0 && (
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
					<Card className='stats-card'>
						<CardContent className='p-5'>
							<div className='flex items-center space-x-3'>
								<div className='p-2 bg-[var(--tag-nutrition-bg)] rounded-[var(--radius-medium)]'>
									<FileText className='w-5 h-5 text-[var(--brand)]' />
								</div>
								<div>
									<div className='card-value text-lg'>{resources.length}</div>
									<div className='card-title'>Total Resources</div>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className='stats-card'>
						<CardContent className='p-5'>
							<div className='flex items-center space-x-3'>
								<div className='p-2 bg-[var(--tag-streaming-bg)] rounded-[var(--radius-medium)]'>
									<Link2 className='w-5 h-5 text-[var(--accent)]' />
								</div>
								<div>
									<div className='card-value text-lg'>{categoryStats.link}</div>
									<div className='card-title'>Links</div>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className='stats-card'>
						<CardContent className='p-5'>
							<div className='flex items-center space-x-3'>
								<div className='p-2 bg-[var(--tag-security-bg)] rounded-[var(--radius-medium)]'>
									<Wrench className='w-5 h-5 text-[var(--warning)]' />
								</div>
								<div>
									<div className='card-value text-lg'>{categoryStats.tool}</div>
									<div className='card-title'>Tools</div>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className='stats-card'>
						<CardContent className='p-5'>
							<div className='flex items-center space-x-3'>
								<div className='p-2 bg-[var(--tag-food-bg)] rounded-[var(--radius-medium)]'>
									<File className='w-5 h-5 text-[var(--chart-nutrition)]' />
								</div>
								<div>
									<div className='card-value text-lg'>{categoryStats.document}</div>
									<div className='card-title'>Documents</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			<div className='flex flex-col lg:flex-row gap-4'>
				<div className='relative flex-1'>
					<Search className='absolute left-3 top-3 h-4 w-4 text-[var(--text-secondary)]' />
					<Input placeholder='Search resources, domains, or contributors...' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className='pl-9' />
				</div>

				<div className='flex gap-2'>
					<select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value as 'date' | 'domain')}
						className='px-3 py-2 border border-[var(--border)] rounded-[var(--radius-medium)] focus:outline-[var(--focus-outline)] focus:outline-offset-[var(--focus-offset)] text-[var(--text-primary)] bg-[var(--card-bg)]'>
						<option value='date'>Sort by Date</option>
						<option value='domain'>Sort by Domain</option>
					</select>
				</div>
			</div>

			<div className='flex flex-wrap gap-2'>
				{Object.entries(categoryStats).map(([category, count]) => (
					<Button
						key={category}
						variant={selectedCategory === category ? 'default' : 'outline'}
						size='sm'
						onClick={() => setSelectedCategory(category as 'all' | 'link' | 'tool' | 'document')}>
						<Filter className='w-4 h-4 mr-2' />
						{category.charAt(0).toUpperCase() + category.slice(1)} ({count})
					</Button>
				))}
			</div>

			<div className='grid gap-4'>
				{paginatedResources.map((resource, index) => (
					<Card key={index}>
						<CardContent className='p-4'>
							<div className='flex items-start justify-between space-x-4'>
								<div className='flex items-start space-x-3 flex-1 min-w-0'>
									<div className='flex-shrink-0 mt-1'>
										<WebsiteIcon domain={resource.domain} size={20} />
									</div>
									<div className='flex-1 min-w-0'>
										<div className='flex items-center space-x-2 mb-2'>
											<Badge className={categoryColors[resource.category]}>{resource.category}</Badge>
											<span className='text-sm text-[var(--text-secondary)]'>{resource.domain}</span>
										</div>

									<h3 className='font-medium text-[var(--text-primary)] mb-2'>
										<a
											href={resource.url}
											target='_blank'
											rel='noopener noreferrer'
											className='hover:text-[var(--brand)] hover:underline transition-colors'
											title={resource.url}>
											{resource.title || (resource.url.length > 50 ? `${resource.url.substring(0, 47)}...` : resource.url)}
										</a>
									</h3>

									<p className='text-sm text-[var(--text-secondary)] mb-3 line-clamp-2'>{linkifyText(resource.context)}</p>

										<div className='flex items-center space-x-4 text-xs text-[var(--text-secondary)]'>
											<div className='flex items-center space-x-1'>
												<User className='w-3 h-3' />
												<span>Shared by {resource.sharedBy}</span>
											</div>
											<div className='flex items-center space-x-1'>
												<Calendar className='w-3 h-3' />
												<span>{format(resource.dateShared, 'MMM dd, yyyy')}</span>
											</div>
										</div>
									</div>
								</div>

								<div className='flex-shrink-0 flex space-x-2'>
									<CopyButton text={resource.url} />
									<Button variant='outline' size='sm' onClick={() => window.open(resource.url, '_blank')}>
										<ExternalLink className='w-4 h-4' />
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} itemsPerPage={itemsPerPage} totalItems={totalItems} />}

			{filteredResources.length === 0 && (
				<Card>
					<CardContent className='p-8 text-center'>
						<div className='text-[var(--text-secondary)]'>
							{searchTerm || selectedCategory !== 'all' ? 'No resources found matching your criteria' : 'No resources found in this chat'}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
