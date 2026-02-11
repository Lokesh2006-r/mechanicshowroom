import { getDb } from '@/lib/db';
import CustomerClient from '@/components/customers/CustomerClient';

export default async function CustomersPage() {
    const db = await getDb();

    return (
        <div className="container animate-fade-in pb-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        Customer Records
                    </h2>
                    <p className="text-slate-400 mt-1">Manage customers and view service history</p>
                </div>
            </div>

            <CustomerClient initialCustomers={db.customers} />
        </div>
    );
}
