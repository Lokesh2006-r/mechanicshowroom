import { getDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminClient from '@/components/admin/AdminClient';
import LogoutButton from '@/components/admin/LogoutButton';
import { MECHANICS_DATA } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (sessionCookie) {
        try {
            const user = JSON.parse(sessionCookie.value);
            if (user.role !== 'admin') {
                redirect('/');
            }
        } catch (e) {
            redirect('/login');
        }
    } else {
        redirect('/login');
    }

    const db = await getDb();

    return (
        <div className="container animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-red-400 bg-clip-text text-transparent">
                        ⚙️ Admin Panel
                    </h2>
                    <p className="text-slate-400 mt-1">Manage products, customers, employees, and system settings</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-1.5">
                        📦 {db.products.length} Products
                    </span>
                    <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-1.5">
                        👥 {db.customers.length} Customers
                    </span>
                    <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-1.5">
                        🛠️ {MECHANICS_DATA.length} Employees
                    </span>
                    <LogoutButton />
                </div>
            </div>

            <AdminClient products={db.products} customers={db.customers} />
        </div>
    );
}
