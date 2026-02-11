import { getDb } from '@/lib/db';
import ServiceForm from './ServiceForm';

export default async function NewServicePage() {
    const db = await getDb();

    return (
        <div className="container animate-fade-in pb-10 max-w-5xl mx-auto">
            <div className="mb-8 border-b border-slate-700 pb-4">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    Create New Job Card
                </h1>
                <p className="text-slate-400 mt-1">
                    Enter service details, assign parts, and generate a job card.
                </p>
            </div>

            <ServiceForm
                customers={db.customers}
                products={db.products}
            />
        </div>
    );
}
