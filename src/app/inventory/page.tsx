import { getDb } from '@/lib/db';
import InventoryClient from '@/components/inventory/InventoryClient';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
    const db = await getDb();

    return (
        <div className="container animate-fade-in pb-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        Inventory & Stock
                    </h2>
                    <p className="text-slate-400 mt-1">Manage tools and spare parts</p>
                </div>
            </div>

            <InventoryClient initialProducts={db.products} />
        </div>
    );
}
