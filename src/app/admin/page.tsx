import { getDb } from '@/lib/db';
import AdminClient from '@/components/admin/AdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const db = await getDb();

    return (
        <div className="container animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-red-400 bg-clip-text text-transparent">
                        ⚙️ Admin Panel
                    </h2>
                    <p className="text-slate-400 mt-1">Manage products, prices, customers, and system settings</p>
                </div>
                <div className="flex gap-2">
                    <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-1.5">
                        📦 {db.products.length} Products
                    </span>
                    <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-1.5">
                        👥 {db.customers.length} Customers
                    </span>
                </div>
            </div>

            <AdminClient products={db.products} customers={db.customers} />
        </div>
    );
}
