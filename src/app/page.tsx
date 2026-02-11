import { getDb } from '@/lib/db';
import { Product } from '@/types';
import Link from 'next/link';
import DownloadReportButton from '@/components/dashboard/DownloadReportButton';

export const dynamic = 'force-dynamic';

// Helper for date calculations
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const SERVICE_CYCLE_DAYS = 150;

function getServiceStatus(lastServiceDateStr: string) {
    const lastService = new Date(lastServiceDateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastService.getTime()) / MS_PER_DAY);
    const daysLeft = SERVICE_CYCLE_DAYS - diffDays;

    if (daysLeft <= 0) return { status: 'overdue', days: Math.abs(daysLeft), label: 'Overdue' };
    if (daysLeft <= 10) return { status: 'due_soon', days: daysLeft, label: 'Due Soon' };
    return { status: 'ok', days: daysLeft, label: 'OK' };
}

export default async function Dashboard() {
    const db = await getDb();

    // Calculate Stats
    let totalRevenue = 0;
    let totalServices = 0;
    const customersDue: { name: string; vehicle: string; phone: string; status: any }[] = [];

    db.customers.forEach(customer => {
        customer.vehicles.forEach(vehicle => {
            // Revenue & Total Services
            vehicle.serviceHistory.forEach(service => {
                totalRevenue += service.totalCost || 0;
                totalServices++;
            });

            // Service Status
            if (vehicle.serviceHistory.length > 0) {
                const lastService = vehicle.serviceHistory[vehicle.serviceHistory.length - 1];
                const status = getServiceStatus(lastService.date);

                if (status.status !== 'ok') {
                    customersDue.push({
                        name: customer.name,
                        vehicle: vehicle.vehicleNumber,
                        phone: customer.phone,
                        status: { ...status, days: Math.abs(status.days) }
                    });
                }
            } else {
                // New vehicle fallback logic - maybe treat as 'Ready for Service' if registered long ago? 
                // For now, only checking history.
            }
        });
    });

    // Calculate Consumption Rates
    const stockPredictions: { product: Product; daysLeft: number; dailyRate: number }[] = [];
    let stockValue = 0;
    const lowStock: Product[] = [];

    const productUsage: Record<string, { totalQty: number; firstUsage: Date; lastUsage: Date }> = {};

    db.customers.forEach(c => {
        c.vehicles.forEach(v => {
            v.serviceHistory.forEach(s => {
                s.partsUsed.forEach(p => {
                    if (!productUsage[p.productId]) {
                        productUsage[p.productId] = {
                            totalQty: 0,
                            firstUsage: new Date(s.date),
                            lastUsage: new Date(s.date)
                        };
                    }
                    productUsage[p.productId].totalQty += p.quantity;
                    const date = new Date(s.date);
                    if (date < productUsage[p.productId].firstUsage) productUsage[p.productId].firstUsage = date;
                    if (date > productUsage[p.productId].lastUsage) productUsage[p.productId].lastUsage = date;
                });
            });
        });
    });

    db.products.forEach(product => {
        stockValue += (product.price * product.quantity);
        if (product.quantity <= product.minStockAlert) {
            lowStock.push(product);
        }

        // Prediction Logic
        if (productUsage[product.id]) {
            const usage = productUsage[product.id];
            const now = new Date();
            // Calculate days spanned. Min 1 to avoid division by zero.
            // Using logic: Time between first usage and now.
            const daysSpanned = Math.max(1, Math.ceil((now.getTime() - usage.firstUsage.getTime()) / MS_PER_DAY));
            const dailyRate = usage.totalQty / daysSpanned;

            if (dailyRate > 0) {
                const daysToEmpty = product.quantity / dailyRate;
                if (daysToEmpty < 30) { // Alert if likely to run out in a month
                    stockPredictions.push({ product, daysLeft: Math.ceil(daysToEmpty), dailyRate });
                }
            }
        }
    });

    return (
        <div className="container animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        Dashboard Overview
                    </h2>
                    <p className="text-slate-400 mt-1">Welcome back, Admin</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <DownloadReportButton
                        data={{
                            totalRevenue,
                            totalServices,
                            stockValue,
                            lowStock,
                            stockPredictions: stockPredictions.map(sp => ({
                                product: sp.product.name,
                                daysLeft: sp.daysLeft,
                                dailyRate: sp.dailyRate
                            })),
                            customersDue: customersDue.map(c => ({
                                name: c.name,
                                vehicle: c.vehicle,
                                phone: c.phone,
                                status: {
                                    status: c.status.status,
                                    days: c.status.days,
                                    label: c.status.label
                                }
                            }))
                        }}
                    />
                    <Link href="/services/new" className="btn btn-primary !px-3 !py-1.5 text-xs shadow-lg shadow-blue-500/30 flex-1 md:flex-none">
                        + New Service
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Revenue"
                    value={`₹${totalRevenue.toLocaleString()}`}
                    trend="Total earnings"
                    icon="💰"
                    color="from-green-500 to-emerald-600"
                />
                <StatCard
                    title="Services Completed"
                    value={totalServices.toString()}
                    trend="Lifetime services"
                    icon="🔧"
                    color="from-blue-500 to-indigo-600"
                />
                <StatCard
                    title="Stock Value"
                    value={`₹${stockValue.toLocaleString()}`}
                    trend="Low stock: "
                    trendSuffix={`${lowStock.length} items`}
                    trendColor={lowStock.length > 0 ? "text-red-400" : "text-green-400"}
                    icon="📦"
                    color="from-purple-500 to-violet-600"
                />
                <StatCard
                    title="Due Services"
                    value={customersDue.length.toString()}
                    trend="Action required"
                    trendColor="text-orange-400"
                    icon="⏰"
                    color="from-orange-500 to-amber-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Low Stock & Predictive Alert */}
                <div className="glass-panel">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <span className="text-red-500">⚠</span> Stock Alerts
                        </h3>
                        <span className="text-xs font-medium px-2 py-1 rounded bg-red-500/20 text-red-400">
                            {lowStock.length} Low • {stockPredictions.length} Predicted
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-400 text-sm border-b border-slate-700">
                                    <th className="pb-3 font-medium">Product</th>
                                    <th className="pb-3 font-medium text-right">Qty</th>
                                    <th className="pb-3 font-medium text-right">Status / Prediction</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {lowStock.length === 0 && stockPredictions.length === 0 ? (
                                    <tr><td colSpan={3} className="text-center py-4 text-slate-500">All stock levels good</td></tr>
                                ) : (
                                    <>
                                        {lowStock.map(p => (
                                            <tr key={p.id} className="group">
                                                <td className="py-3 font-medium text-slate-200 group-hover:text-white">
                                                    {p.name}
                                                    <span className="block text-xs text-slate-500">{p.category}</span>
                                                </td>
                                                <td className="py-3 text-right font-bold text-slate-200">{p.quantity}</td>
                                                <td className="py-3 text-right">
                                                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                                                        Low Stock
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {stockPredictions
                                            .filter(pred => !lowStock.find(ls => ls.id === pred.product.id)) // Don't show duplicates
                                            .map(pred => (
                                                <tr key={pred.product.id} className="group">
                                                    <td className="py-3 font-medium text-slate-200 group-hover:text-white">
                                                        {pred.product.name}
                                                        <span className="block text-xs text-slate-500">{pred.product.category}</span>
                                                    </td>
                                                    <td className="py-3 text-right font-bold text-slate-200">{pred.product.quantity}</td>
                                                    <td className="py-3 text-right">
                                                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                                            Empty in ~{pred.daysLeft} days
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        }
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Service Reminders */}
                <div className="glass-panel">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <span className="text-blue-500">📅</span> Upcoming Services
                        </h3>
                        <span className="text-xs font-medium px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                            Auto-Reminder Active
                        </span>
                    </div>

                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                        {customersDue.length === 0 ? (
                            <p className="text-center text-slate-500 py-4">No services due soon.</p>
                        ) : (
                            customersDue.map((c, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700/50">
                                    <div>
                                        <p className="font-semibold text-white">{c.name}</p>
                                        <p className="text-sm text-slate-400">{c.vehicle} • {c.phone}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`block text-xs font-bold px-2 py-1 rounded mb-1 ${c.status.status === 'overdue'
                                            ? 'bg-red-500/20 text-red-400'
                                            : 'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {c.status.label}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {c.status.status === 'overdue'
                                                ? `${c.status.days} days ago`
                                                : `${c.status.days} days left`}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

function StatCard({ title, value, trend, trendSuffix, trendColor, icon, color }: any) {
    return (
        <div className="glass-panel relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br ${color} blur-2xl w-32 h-32 rounded-full -mr-10 -mt-10`}></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-slate-400 text-sm font-medium uppercase tracking-wide">{title}</p>
                        <h3 className="text-3xl font-bold text-white mt-1">{value}</h3>
                    </div>
                    <span className="text-2xl opacity-80">{icon}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span className={trendColor || "text-green-400"}>
                        {trend} <span className="text-slate-400 font-normal">{trendSuffix}</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
