import { getDb } from '@/lib/db';
import BillingClient from '@/components/billing/BillingClient';

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
    const db = await getDb();

    return (
        <div className="container animate-fade-in pb-10">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                        Service Billing
                    </h2>
                    <p className="text-[13px] mt-0.5" style={{ color: '#86868B' }}>Create new service invoices and manage billing</p>
                </div>
            </div>

            <BillingClient products={db.products} customers={db.customers} />
        </div>
    );
}
