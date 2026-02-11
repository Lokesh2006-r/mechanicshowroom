import { getDb } from '@/lib/db';
import BillingClient from '@/components/billing/BillingClient';

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
    const db = await getDb();

    return (
        <div className="container animate-fade-in pb-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        Service Billing
                    </h2>
                    <p className="text-slate-400 mt-1">Create new service invoices and manage billing</p>
                </div>
            </div>

            <BillingClient products={db.products} customers={db.customers} />
        </div>
    );
}
