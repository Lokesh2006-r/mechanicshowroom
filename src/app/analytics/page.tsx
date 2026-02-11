import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
    const db = await getDb();

    // Calculate analytics
    const partUsage: Record<string, number> = {};
    let totalPartsRevenue = 0;
    let totalServiceRevenue = 0;
    const vehicleTypes: Record<string, number> = {};

    db.customers.forEach(c => {
        c.vehicles.forEach(v => {
            v.serviceHistory.forEach(s => {
                // Vehicle Type stats
                vehicleTypes[v.vehicleType] = (vehicleTypes[v.vehicleType] || 0) + 1;

                // Revenue split
                let partsCost = 0;
                s.partsUsed.forEach(p => {
                    partsCost += (p.costAtService * p.quantity);
                    const partName = p.name || 'Unknown Part'; // Fallback
                    partUsage[partName] = (partUsage[partName] || 0) + p.quantity;
                });

                // Assuming totalPartsRevenue tracks pure cost of parts
                totalPartsRevenue += partsCost;
                totalServiceRevenue += s.serviceCharge;
            });
        });
    });

    const topParts = Object.entries(partUsage)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    return (
        <div className="container animate-fade-in pb-10">
            <div className="mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Business Analytics
                </h2>
                <p className="text-slate-400 mt-1">Performance metrics and insights</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                <div className="glass-panel">
                    <h3 className="text-xl font-bold text-white mb-6">Revenue Breakdown</h3>
                    <div className="flex items-center justify-center p-8">
                        <div className="w-48 h-48 rounded-full border-8 border-slate-700 relative flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-slate-400 text-sm">Total</p>
                                <p className="text-2xl font-bold text-white">₹{(totalPartsRevenue + totalServiceRevenue).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-around mt-4">
                        <div className="text-center">
                            <p className="text-blue-400 font-bold">₹{totalServiceRevenue.toLocaleString()}</p>
                            <p className="text-slate-500 text-sm">Service Labor</p>
                        </div>
                        <div className="text-center">
                            <p className="text-emerald-400 font-bold">₹{totalPartsRevenue.toLocaleString()}</p>
                            <p className="text-slate-500 text-sm">Spare Parts</p>
                        </div>
                    </div>
                </div>

                <div className="glass-panel">
                    <h3 className="text-xl font-bold text-white mb-6">Top Consumed Parts</h3>
                    <div className="space-y-4">
                        {topParts.length === 0 ? <p className="text-slate-500">No data available</p> :
                            topParts.map(([name, qty], i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-slate-700 text-xs flex items-center justify-center text-slate-300">{i + 1}</span>
                                        <span className="text-slate-200">{name}</span>
                                    </div>
                                    <div className="w-32 bg-slate-800 rounded-full h-2 overflow-hidden mx-4">
                                        <div className="bg-blue-500 h-full" style={{ width: `${(qty / topParts[0][1]) * 100}%` }}></div>
                                    </div>
                                    <span className="font-bold text-white">{qty} units</span>
                                </div>
                            ))
                        }
                    </div>
                </div>

                <div className="glass-panel md:col-span-2">
                    <h3 className="text-xl font-bold text-white mb-6">Vehicle Service Frequency</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(vehicleTypes).map(([type, count]) => (
                            <div key={type} className="bg-slate-800/50 p-4 rounded-lg text-center border border-slate-700">
                                <p className="text-slate-400 text-sm mb-1">{type}</p>
                                <p className="text-2xl font-bold text-white">{count}</p>
                                <p className="text-xs text-slate-500">Visits</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
