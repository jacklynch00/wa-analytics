import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'Waly',
	description: 'Analyze WhatsApp group chat exports to gain insights into member engagement, resources shared, and community activity patterns.',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en'>
			<head>
				<script src='https://planemetrics.com/js/client.js' data-website-id='b1864087-ee8b-407a-9714-6b5084459ea4' defer></script>
			</head>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				{children}
				<Toaster />
			</body>
		</html>
	);
}
