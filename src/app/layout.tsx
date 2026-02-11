import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AppLayout from '@/components/layout/AppLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Mechanical Workshop Management',
    description: 'Manage inventory, customers, and billing efficiently.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-slate-900`}>
                <AppLayout>
                    {children}
                </AppLayout>
            </body>
        </html>
    );
}
