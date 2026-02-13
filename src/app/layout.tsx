import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AppLayout from '@/components/layout/AppLayout';
import { cookies } from 'next/headers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Mechanical Workshop Management',
    description: 'Manage inventory, customers, and billing efficiently.',
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    let user = null;

    if (sessionCookie) {
        try {
            user = JSON.parse(sessionCookie.value);
        } catch (e) {
            console.error("Failed to parse session cookie", e);
        }
    }

    return (
        <html lang="en">
            <body className={`${inter.className}`} style={{ background: '#1a1a2e' }}>
                <AppLayout user={user}>
                    {children}
                </AppLayout>
            </body>
        </html>
    );
}
