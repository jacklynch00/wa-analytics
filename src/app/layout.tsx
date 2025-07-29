import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { ReactQueryProvider } from '@/lib/react-query';

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
				<script defer data-website-id='688642f766757e5583e11bfa' data-domain='usewaly.com' src='https://datafa.st/js/script.js'></script>
			</head>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<ReactQueryProvider>
					{children}
				</ReactQueryProvider>
				<Toaster />
			</body>
		</html>
	);
}
