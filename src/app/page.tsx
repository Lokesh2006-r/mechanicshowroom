import { getDb } from '@/lib/db';
import { Product } from '@/types';
import Link from 'next/link';
import DownloadReportButton from '@/components/dashboard/DownloadReportButton';
import DashboardStats from '@/components/dashboard/DashboardStats';

export const dynamic = 'force-dynamic';

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

    let totalRevenue = 0;
    let totalServices = 0;
    const customersDue: { name: string; vehicle: string; phone: string; status: any }[] = [];

    db.customers.forEach(customer => {
        customer.vehicles.forEach(vehicle => {
            vehicle.serviceHistory.forEach(service => {
                totalRevenue += service.totalCost || 0;
                totalServices++;
            });
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
            }
        });
    });

    const stockPredictions: { product: Product; daysLeft: number; dailyRate: number }[] = [];
    let stockValue = 0;
    const lowStock: Product[] = [];
    const productUsage: Record<string, { totalQty: number; firstUsage: Date; lastUsage: Date }> = {};

    db.customers.forEach(c => {
        c.vehicles.forEach(v => {
            v.serviceHistory.forEach(s => {
                s.partsUsed.forEach(p => {
                    if (!productUsage[p.productId]) {
                        productUsage[p.productId] = { totalQty: 0, firstUsage: new Date(s.date), lastUsage: new Date(s.date) };
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
        if (product.quantity <= product.minStockAlert) lowStock.push(product);
        if (productUsage[product.id]) {
            const usage = productUsage[product.id];
            const now = new Date();
            const daysSpanned = Math.max(1, Math.ceil((now.getTime() - usage.firstUsage.getTime()) / MS_PER_DAY));
            const dailyRate = usage.totalQty / daysSpanned;
            if (dailyRate > 0) {
                const daysToEmpty = product.quantity / dailyRate;
                if (daysToEmpty < 30) stockPredictions.push({ product, daysLeft: Math.ceil(daysToEmpty), dailyRate });
            }
        }
    });

    return (
        <div className="container animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                        Dashboard Overview
                    </h2>
                    <p className="text-[13px] mt-0.5" style={{ color: '#86868B' }}>Welcome back, Admin — here&apos;s your shop at a glance</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <DownloadReportButton
                        data={{
                            totalRevenue, totalServices, stockValue, lowStock,
                            stockPredictions: stockPredictions.map(sp => ({ product: sp.product.name, daysLeft: sp.daysLeft, dailyRate: sp.dailyRate })),
                            customersDue: customersDue.map(c => ({ name: c.name, vehicle: c.vehicle, phone: c.phone, status: { status: c.status.status, days: c.status.days, label: c.status.label } }))
                        }}
                    />
                    <Link href="/services/new" className="btn btn-primary !px-3.5 !py-2 text-xs flex-1 md:flex-none">
                        + New Service
                    </Link>
                </div>
            </div>

            {/* Interactive Stats */}
            <DashboardStats customers={db.customers} products={db.products} />

            {/* Bottom Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Stock Alerts — macOS Window style */}
                <div className="mac-window">
                    <div className="mac-window-titlebar">
                        <div className="mac-window-dots">
                            <span className="mac-window-dot red"></span>
                            <span className="mac-window-dot yellow"></span>
                            <span className="mac-window-dot green"></span>
                        </div>
                        <span className="mac-window-title">Stock Alerts</span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,69,58,0.12)', color: '#FF453A', border: '1px solid rgba(255,69,58,0.15)' }}>
                            {lowStock.length} Low • {stockPredictions.length} Predicted
                        </span>
                    </div>
                    <div className="mac-window-body">
                        <table className="w-full text-left">
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <th className="pb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#5A5A6E' }}>Product</th>
                                    <th className="pb-2 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#5A5A6E' }}>Qty</th>
                                    <th className="pb-2 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#5A5A6E' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lowStock.length === 0 && stockPredictions.length === 0 ? (
                                    <tr><td colSpan={3} className="text-center py-6 text-[13px]" style={{ color: '#5A5A6E' }}>✓ All stock levels good</td></tr>
                                ) : (
                                    <>
                                        {lowStock.map(p => (
                                            <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="py-2.5">
                                                    <span className="text-white font-medium text-[13px]">{p.name}</span>
                                                    <span className="block text-[11px]" style={{ color: '#5A5A6E' }}>{p.category}</span>
                                                </td>
                                                <td className="py-2.5 text-right text-white font-bold">{p.quantity}</td>
                                                <td className="py-2.5 text-right">
                                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,69,58,0.12)', color: '#FF453A', border: '1px solid rgba(255,69,58,0.2)' }}>Low Stock</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {stockPredictions.filter(pred => !lowStock.find(ls => ls.id === pred.product.id)).map(pred => (
                                            <tr key={pred.product.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="py-2.5">
                                                    <span className="text-white font-medium text-[13px]">{pred.product.name}</span>
                                                    <span className="block text-[11px]" style={{ color: '#5A5A6E' }}>{pred.product.category}</span>
                                                </td>
                                                <td className="py-2.5 text-right text-white font-bold">{pred.product.quantity}</td>
                                                <td className="py-2.5 text-right">
                                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,214,10,0.12)', color: '#FFD60A', border: '1px solid rgba(255,214,10,0.2)' }}>~{pred.daysLeft}d left</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Upcoming Services — macOS Window style */}
                <div className="mac-window">
                    <div className="mac-window-titlebar">
                        <div className="mac-window-dots">
                            <span className="mac-window-dot red"></span>
                            <span className="mac-window-dot yellow"></span>
                            <span className="mac-window-dot green"></span>
                        </div>
                        <span className="mac-window-title">Upcoming Services</span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md" style={{ background: 'rgba(0,122,255,0.12)', color: '#007AFF', border: '1px solid rgba(0,122,255,0.15)' }}>
                            Auto-Reminder Active
                        </span>
                    </div>
                    <div className="mac-window-body">
                        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                            {customersDue.length === 0 ? (
                                <p className="text-center py-6 text-[13px]" style={{ color: '#5A5A6E' }}>🎉 No services due soon.</p>
                            ) : (
                                customersDue.map((c, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl transition-all hover:-translate-y-0.5" style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.04)',
                                    }}>
                                        <div>
                                            <p className="font-semibold text-white text-[13px]">{c.name}</p>
                                            <p className="text-[12px]" style={{ color: '#86868B' }}>{c.vehicle} • {c.phone}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`block text-[11px] font-bold px-2 py-0.5 rounded-md mb-1`} style={{
                                                background: c.status.status === 'overdue' ? 'rgba(255,69,58,0.12)' : 'rgba(255,214,10,0.12)',
                                                color: c.status.status === 'overdue' ? '#FF453A' : '#FFD60A',
                                            }}>
                                                {c.status.label}
                                            </span>
                                            <span className="text-[11px]" style={{ color: '#5A5A6E' }}>
                                                {c.status.status === 'overdue' ? `${c.status.days} days ago` : `${c.status.days} days left`}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
