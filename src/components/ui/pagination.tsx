import React from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	itemsPerPage: number;
	totalItems: number;
}

export function Pagination({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems }: PaginationProps) {
	const startItem = (currentPage - 1) * itemsPerPage + 1;
	const endItem = Math.min(currentPage * itemsPerPage, totalItems);

	const getVisiblePages = () => {
		const delta = 2;
		const pages: (number | string)[] = [];

		if (totalPages <= 7) {
			// Show all pages if total is 7 or less
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			// Always show first page
			pages.push(1);

			if (currentPage > delta + 2) {
				pages.push('...');
			}

			// Show pages around current page
			const start = Math.max(2, currentPage - delta);
			const end = Math.min(totalPages - 1, currentPage + delta);

			for (let i = start; i <= end; i++) {
				pages.push(i);
			}

			if (currentPage < totalPages - delta - 1) {
				pages.push('...');
			}

			// Always show last page
			if (totalPages > 1) {
				pages.push(totalPages);
			}
		}

		return pages;
	};

	const visiblePages = getVisiblePages();

	return (
		<div className='flex items-center justify-between px-2'>
			<div className='flex-1 flex justify-between sm:hidden'>
				<Button variant='outline' size='sm' onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
					Previous
				</Button>
				<Button variant='outline' size='sm' onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
					Next
				</Button>
			</div>

			<div className='hidden sm:flex-1 sm:flex sm:items-center sm:justify-between'>
				<div>
					<p className='text-sm text-gray-700'>
						Showing <span className='font-medium'>{startItem}</span> to <span className='font-medium'>{endItem}</span> of{' '}
						<span className='font-medium'>{totalItems}</span> results
					</p>
				</div>

				<div>
					<nav className='relative z-0 inline-flex rounded-md shadow-sm' aria-label='Pagination'>
						<Button
							variant='outline'
							size='sm'
							onClick={() => onPageChange(currentPage - 1)}
							disabled={currentPage === 1}
							className='relative inline-flex items-center px-2 py-2 rounded-l-md border-0 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50'>
							<span className='sr-only'>Previous</span>
							<ChevronLeft className='h-4 w-4' />
						</Button>

						{visiblePages.map((page, index) => (
							<React.Fragment key={index}>
								{page === '...' ? (
									<span className='relative inline-flex items-center px-4 py-2 border-0 bg-white text-sm font-medium text-gray-700'>...</span>
								) : (
									<Button
										variant={currentPage === page ? 'default' : 'outline'}
										size='sm'
										onClick={() => onPageChange(page as number)}
										className='relative inline-flex items-center px-4 py-2 border-0 text-sm font-medium'>
										{page}
									</Button>
								)}
							</React.Fragment>
						))}

						<Button
							variant='outline'
							size='sm'
							onClick={() => onPageChange(currentPage + 1)}
							disabled={currentPage === totalPages}
							className='relative inline-flex items-center px-2 py-2 rounded-r-md border-0 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50'>
							<span className='sr-only'>Next</span>
							<ChevronRight className='h-4 w-4' />
						</Button>
					</nav>
				</div>
			</div>
		</div>
	);
}

export function usePagination<T>(items: T[], itemsPerPage: number = 10) {
	const [currentPage, setCurrentPage] = React.useState(1);

	const totalPages = Math.ceil(items.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentItems = items.slice(startIndex, endIndex);

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	React.useEffect(() => {
		// Reset to page 1 when items change
		setCurrentPage(1);
	}, [items.length]);

	return {
		currentItems,
		currentPage,
		totalPages,
		totalItems: items.length,
		itemsPerPage,
		handlePageChange,
	};
}
