
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ReportClient from '@/components/reports/ReportClient';

export default async function ReportsPage() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (sessionCookie) {
        try {
            const user = JSON.parse(sessionCookie.value);
            if (user.role !== 'admin') {
                redirect('/');
            }
        } catch (e) {
            // Ignore parse error, maybe redirect to login if critical but here just let it render if session exists but invalid structure? 
            // Better to redirect to login if session is invalid.
            redirect('/login');
        }
    } else {
        redirect('/login');
    }

    return <ReportClient />;
}
