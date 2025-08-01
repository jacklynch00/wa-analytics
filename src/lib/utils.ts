import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Construct a file URL that goes through the /api/files/ endpoint
 * This ensures proper authentication and access control
 */
export function getFileUrl(fileKey: string): string {
	if (!fileKey) return '';

	// If it's already a full URL, return as is
	if (fileKey.startsWith('http://') || fileKey.startsWith('https://')) {
		return fileKey;
	}

	// If it's a relative path starting with /api/files/, return as is
	if (fileKey.startsWith('/api/files/')) {
		return fileKey;
	}

	// Construct the URL to go through our file serving endpoint
	return `/api/files/${encodeURIComponent(fileKey)}`;
}
