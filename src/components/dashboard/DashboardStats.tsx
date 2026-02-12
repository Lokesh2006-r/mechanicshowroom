'use client';

import { useState, useEffect } from 'react';
import { Product, Customer } from '@/types';

// --------------- macOS Wide Modal ---------------
function WideModal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShow(true);
            document.body.style.overflow = 'hidden';
        } else {
            setTimeout(() => setShow(false), 300);
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    if (!isOpen && !show) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0" style={{
                background: 'rgba(0, 0, 0, 0.45)',
                backdropFilter: 'blur(8px) saturate(1.2)',
                WebkitBackdropFilter: 'blur(8px) saturate(1.2)',
            }} onClick={onClose}></div>

            <div className={`relative w-full max-w-4xl transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
                style={{
                    background: 'rgba(30, 30, 56, 0.95)',
                    backdropFilter: 'blur(40px) saturate(1.8)',
                    WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    boxShadow: '0 22px 70px 4px rgba(0,0,0,0.56), 0 0 0 1px rgba(255,255,255,0.03) inset',
                    overflow: 'hidden',
                }}
            >
                {/* macOS Titlebar */}
                <div className="flex items-center gap-2 px-4 py-3.5" style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                    <button onClick={onClose} className="w-3 h-3 rounded-full hover:brightness-110 transition-all flex items-center justify-center group"
                        style={{ background: '#FF5F57', boxShadow: '0 0 4px rgba(255,95,87,0.4)' }}>
                        <span className="text-[8px] text-black/60 opacity-0 group-hover:opacity-100 font-bold leading-none">✕</span>
                    </button>
                    <span className="w-3 h-3 rounded-full" style={{ background: '#FFBD2E', boxShadow: '0 0 4px rgba(255,189,46,0.4)' }}></span>
                    <span className="w-3 h-3 rounded-full" style={{ background: '#28C840', boxShadow: '0 0 4px rgba(40,200,64,0.4)' }}></span>
                    <h3 className="flex-1 text-center text-[13px] font-medium text-[#86868B] pr-12 truncate">{title}</h3>
                </div>
                <div className="p-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
}

// --------------- Types ---------------
interface ServiceDetail {
    customerName: string;
    customerPhone: string;
    vehicleNumber: string;
    vehicleModel: string;
    serviceId: string;
    date: string;
    type: string;
    mechanic: string;
    serviceCharge: number;
    gstAmount: number;
    totalCost: number;
    notes: string;
}

interface StockItem {
    id: string;
    name: string;
    category: string;
    supplier: string;
    price: number;
    quantity: number;
    stockValue: number;
    gstRate: number;
    minStockAlert: number;
    isLow: boolean;
}

interface DueService {
    name: string;
    phone: string;
    vehicle: string;
    vehicleModel: string;
    lastServiceDate: string;
    status: string;
    label: string;
    days: number;
}

interface DashboardStatsProps {
    customers: Customer[];
    products: Product[];
}

// --------------- Helper ---------------
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const SERVICE_CYCLE_DAYS = 150;

function formatDate(dateStr: string) {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
}

function formatCurrency(amount: number) {
    return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// macOS-style stat card colors
const cardConfigs = [
    {
        key: 'revenue',
        gradient: 'from-[#30D158] to-[#34C759]',
        glow: 'rgba(48, 209, 88, 0.12)',
        border: 'rgba(48, 209, 88, 0.2)',
        iconBg: 'linear-gradient(135deg, #30D158, #28A745)',
        accentText: '#30D158',
    },
    {
        key: 'services',
        gradient: 'from-[#007AFF] to-[#5856D6]',
        glow: 'rgba(0, 122, 255, 0.12)',
        border: 'rgba(0, 122, 255, 0.2)',
        iconBg: 'linear-gradient(135deg, #007AFF, #5856D6)',
        accentText: '#007AFF',
    },
    {
        key: 'stock',
        gradient: 'from-[#AF52DE] to-[#BF5AF2]',
        glow: 'rgba(175, 82, 222, 0.12)',
        border: 'rgba(175, 82, 222, 0.2)',
        iconBg: 'linear-gradient(135deg, #AF52DE, #BF5AF2)',
        accentText: '#AF52DE',
    },
    {
        key: 'due',
        gradient: 'from-[#FF9F0A] to-[#FF6B00]',
        glow: 'rgba(255, 159, 10, 0.12)',
        border: 'rgba(255, 159, 10, 0.2)',
        iconBg: 'linear-gradient(135deg, #FF9F0A, #FF6B00)',
        accentText: '#FF9F0A',
    },
];

// --------------- Main Component ---------------
export default function DashboardStats({ customers, products }: DashboardStatsProps) {
    const [activeModal, setActiveModal] = useState<'revenue' | 'services' | 'stock' | 'due' | null>(null);

    // ---- Compute all data ----
    const allServices: ServiceDetail[] = [];
    let totalRevenue = 0;
    const dueServices: DueService[] = [];

    customers.forEach(customer => {
        customer.vehicles.forEach(vehicle => {
            vehicle.serviceHistory.forEach(service => {
                totalRevenue += service.totalCost || 0;
                allServices.push({
                    customerName: customer.name,
                    customerPhone: customer.phone,
                    vehicleNumber: vehicle.vehicleNumber,
                    vehicleModel: vehicle.modelName,
                    serviceId: service.id,
                    date: service.date,
                    type: service.type,
                    mechanic: service.mechanic || '—',
                    serviceCharge: service.serviceCharge,
                    gstAmount: service.gstAmount,
                    totalCost: service.totalCost,
                    notes: service.notes || '',
                });
            });

            if (vehicle.serviceHistory.length > 0) {
                const lastService = vehicle.serviceHistory[vehicle.serviceHistory.length - 1];
                const lastDate = new Date(lastService.date);
                const now = new Date();
                const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / MS_PER_DAY);
                const daysLeft = SERVICE_CYCLE_DAYS - diffDays;

                if (daysLeft <= 10) {
                    dueServices.push({
                        name: customer.name,
                        phone: customer.phone,
                        vehicle: vehicle.vehicleNumber,
                        vehicleModel: vehicle.modelName,
                        lastServiceDate: lastService.date,
                        status: daysLeft <= 0 ? 'overdue' : 'due_soon',
                        label: daysLeft <= 0 ? 'Overdue' : 'Due Soon',
                        days: Math.abs(daysLeft),
                    });
                }
            }
        });
    });

    allServices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const stockItems: StockItem[] = products.map(p => ({
        id: p.id, name: p.name, category: p.category, supplier: p.supplier,
        price: p.price, quantity: p.quantity, stockValue: p.price * p.quantity,
        gstRate: p.gstRate, minStockAlert: p.minStockAlert, isLow: p.quantity <= p.minStockAlert,
    }));
    const totalStockValue = stockItems.reduce((s, i) => s + i.stockValue, 0);
    const lowStockCount = stockItems.filter(i => i.isLow).length;

    const cardData = [
        { title: 'Total Revenue', value: formatCurrency(totalRevenue), sub: 'Total earnings', icon: '💰', modal: 'revenue' as const },
        { title: 'Services Completed', value: allServices.length.toString(), sub: 'Lifetime services', icon: '🔧', modal: 'services' as const },
        { title: 'Stock Value', value: formatCurrency(totalStockValue), sub: lowStockCount > 0 ? `${lowStockCount} low stock items` : 'All stock OK', icon: '📦', modal: 'stock' as const, warn: lowStockCount > 0 },
        { title: 'Due Services', value: dueServices.length.toString(), sub: 'Action required', icon: '⏰', modal: 'due' as const, warn: dueServices.length > 0 },
    ];

    return (
        <>
            {/* Stats Grid — macOS widget cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
                {cardData.map((card, i) => {
                    const cfg = cardConfigs[i];
                    return (
                        <button
                            key={card.modal}
                            onClick={() => setActiveModal(card.modal)}
                            className="text-left mac-shine relative group cursor-pointer transition-all duration-300 hover:-translate-y-1"
                            style={{
                                background: 'rgba(30, 30, 56, 0.72)',
                                backdropFilter: 'blur(24px) saturate(1.8)',
                                WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '16px',
                                padding: '1.25rem',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)',
                                overflow: 'hidden',
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.borderColor = cfg.border;
                                (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${cfg.glow}`;
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)';
                            }}
                        >
                            {/* Background glow orb */}
                            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-500 blur-2xl"
                                style={{ background: cfg.iconBg }}
                            ></div>

                            {/* Top edge highlight */}
                            <div className="absolute top-0 left-8 right-8 h-px" style={{
                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                            }}></div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#86868B' }}>{card.title}</p>
                                        <h3 className="text-2xl font-bold text-white mt-0.5 tracking-tight">{card.value}</h3>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-lg"
                                        style={{ background: cfg.iconBg }}>
                                        {card.icon}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium" style={{ color: card.warn ? '#FF453A' : cfg.accentText }}>
                                        {card.sub}
                                    </span>
                                    <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ color: cfg.accentText }}>
                                        View →
                                    </span>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ======= REVENUE DETAIL MODAL ======= */}
            <WideModal isOpen={activeModal === 'revenue'} onClose={() => setActiveModal(null)} title="💰 Revenue Breakdown">
                <div className="space-y-5">
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Total Revenue', value: formatCurrency(totalRevenue), color: '#30D158' },
                            { label: 'Total Services', value: allServices.length.toString(), color: '#007AFF' },
                            { label: 'Avg per Service', value: allServices.length > 0 ? formatCurrency(totalRevenue / allServices.length) : '₹0', color: '#AF52DE' },
                        ].map((s, i) => (
                            <div key={i} className="text-center rounded-xl p-3.5" style={{
                                background: `${s.color}10`,
                                border: `1px solid ${s.color}25`,
                            }}>
                                <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                                <p className="text-[11px] mt-0.5" style={{ color: '#86868B' }}>{s.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    {['Date', 'Customer', 'Vehicle', 'Type', 'Service ₹', 'GST ₹', 'Total ₹'].map(h => (
                                        <th key={h} className="pb-3 pr-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#5A5A6E' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {allServices.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-8" style={{ color: '#5A5A6E' }}>No revenue data yet.</td></tr>
                                ) : allServices.map((s, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td className="py-2.5 pr-3 whitespace-nowrap" style={{ color: '#86868B' }}>{formatDate(s.date)}</td>
                                        <td className="py-2.5 pr-3">
                                            <p className="text-white font-medium text-[13px]">{s.customerName}</p>
                                            <p className="text-[11px]" style={{ color: '#5A5A6E' }}>{s.customerPhone}</p>
                                        </td>
                                        <td className="py-2.5 pr-3 whitespace-nowrap" style={{ color: '#86868B' }}>{s.vehicleNumber}</td>
                                        <td className="py-2.5 pr-3">
                                            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(0,122,255,0.12)', color: '#64D2FF', border: '1px solid rgba(0,122,255,0.2)' }}>{s.type}</span>
                                        </td>
                                        <td className="py-2.5 pr-3 text-right font-mono text-[13px]" style={{ color: '#86868B' }}>{formatCurrency(s.serviceCharge)}</td>
                                        <td className="py-2.5 pr-3 text-right font-mono text-[13px]" style={{ color: '#5A5A6E' }}>{formatCurrency(s.gstAmount)}</td>
                                        <td className="py-2.5 text-right font-mono text-[13px] font-bold" style={{ color: '#30D158' }}>{formatCurrency(s.totalCost)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            {allServices.length > 0 && (
                                <tfoot>
                                    <tr style={{ borderTop: '2px solid rgba(255,255,255,0.08)' }}>
                                        <td colSpan={6} className="py-3 text-right text-white font-bold">Grand Total</td>
                                        <td className="py-3 text-right font-bold text-lg font-mono" style={{ color: '#30D158' }}>{formatCurrency(totalRevenue)}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </WideModal>

            {/* ======= SERVICES COMPLETED MODAL ======= */}
            <WideModal isOpen={activeModal === 'services'} onClose={() => setActiveModal(null)} title="🔧 All Completed Services">
                <div className="space-y-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: 'Total', value: allServices.length, color: '#007AFF' },
                            { label: 'General Service', value: allServices.filter(s => s.type === 'General Service').length, color: '#30D158' },
                            { label: 'Oil Change', value: allServices.filter(s => s.type === 'Oil Change').length, color: '#FF9F0A' },
                            { label: 'Other', value: allServices.filter(s => !['General Service', 'Oil Change'].includes(s.type)).length, color: '#AF52DE' },
                        ].map((s, i) => (
                            <div key={i} className="text-center rounded-xl p-3" style={{ background: `${s.color}10`, border: `1px solid ${s.color}20` }}>
                                <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                                <p className="text-[11px] mt-0.5" style={{ color: '#86868B' }}>{s.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    {['#', 'Date', 'Customer', 'Vehicle', 'Type', 'Mechanic', 'Total ₹'].map(h => (
                                        <th key={h} className="pb-3 pr-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#5A5A6E' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {allServices.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-8" style={{ color: '#5A5A6E' }}>No services completed yet.</td></tr>
                                ) : allServices.map((s, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td className="py-2.5 pr-3 text-[12px]" style={{ color: '#5A5A6E' }}>{i + 1}</td>
                                        <td className="py-2.5 pr-3 whitespace-nowrap" style={{ color: '#86868B' }}>{formatDate(s.date)}</td>
                                        <td className="py-2.5 pr-3 text-white font-medium text-[13px]">{s.customerName}</td>
                                        <td className="py-2.5 pr-3">
                                            <p style={{ color: '#86868B' }}>{s.vehicleNumber}</p>
                                            <p className="text-[11px]" style={{ color: '#5A5A6E' }}>{s.vehicleModel}</p>
                                        </td>
                                        <td className="py-2.5 pr-3">
                                            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(0,122,255,0.12)', color: '#64D2FF', border: '1px solid rgba(0,122,255,0.2)' }}>{s.type}</span>
                                        </td>
                                        <td className="py-2.5 pr-3" style={{ color: '#86868B' }}>{s.mechanic}</td>
                                        <td className="py-2.5 text-right font-mono font-bold text-[13px]" style={{ color: '#30D158' }}>{formatCurrency(s.totalCost)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </WideModal>

            {/* ======= STOCK VALUE MODAL ======= */}
            <WideModal isOpen={activeModal === 'stock'} onClose={() => setActiveModal(null)} title="📦 Inventory & Stock Value">
                <div className="space-y-5">
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Total Stock Value', value: formatCurrency(totalStockValue), color: '#AF52DE' },
                            { label: 'Total Products', value: stockItems.length.toString(), color: '#007AFF' },
                            { label: 'Low Stock Items', value: lowStockCount.toString(), color: '#FF453A' },
                        ].map((s, i) => (
                            <div key={i} className="text-center rounded-xl p-3.5" style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}>
                                <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                                <p className="text-[11px] mt-0.5" style={{ color: '#86868B' }}>{s.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    {['Product', 'Category', 'Supplier', 'Price ₹', 'Qty', 'Stock Value ₹', 'Status'].map(h => (
                                        <th key={h} className="pb-3 pr-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#5A5A6E' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {stockItems.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-8" style={{ color: '#5A5A6E' }}>No inventory data.</td></tr>
                                ) : stockItems.map(item => (
                                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors" style={{
                                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                                        background: item.isLow ? 'rgba(255,69,58,0.04)' : 'transparent',
                                    }}>
                                        <td className="py-2.5 pr-3 text-white font-medium text-[13px]">{item.name}</td>
                                        <td className="py-2.5 pr-3">
                                            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{
                                                background: item.category === 'Tool' ? 'rgba(175,82,222,0.12)' : 'rgba(100,210,255,0.12)',
                                                color: item.category === 'Tool' ? '#BF5AF2' : '#64D2FF',
                                                border: `1px solid ${item.category === 'Tool' ? 'rgba(175,82,222,0.2)' : 'rgba(100,210,255,0.2)'}`,
                                            }}>{item.category}</span>
                                        </td>
                                        <td className="py-2.5 pr-3 text-[13px]" style={{ color: '#86868B' }}>{item.supplier}</td>
                                        <td className="py-2.5 pr-3 text-right font-mono text-[13px]" style={{ color: '#86868B' }}>{formatCurrency(item.price)}</td>
                                        <td className="py-2.5 pr-3 text-right font-bold" style={{ color: item.isLow ? '#FF453A' : '#F5F5F7' }}>{item.quantity}</td>
                                        <td className="py-2.5 pr-3 text-right font-mono font-bold text-[13px]" style={{ color: '#30D158' }}>{formatCurrency(item.stockValue)}</td>
                                        <td className="py-2.5 text-center">
                                            {item.isLow ? (
                                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,69,58,0.12)', color: '#FF453A', border: '1px solid rgba(255,69,58,0.2)' }}>⚠ Low</span>
                                            ) : (
                                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(48,209,88,0.12)', color: '#30D158', border: '1px solid rgba(48,209,88,0.2)' }}>✓ OK</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {stockItems.length > 0 && (
                                <tfoot>
                                    <tr style={{ borderTop: '2px solid rgba(255,255,255,0.08)' }}>
                                        <td colSpan={5} className="py-3 text-right text-white font-bold">Total Stock Value</td>
                                        <td className="py-3 text-right font-bold text-lg font-mono" style={{ color: '#30D158' }}>{formatCurrency(totalStockValue)}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </WideModal>

            {/* ======= DUE SERVICES MODAL ======= */}
            <WideModal isOpen={activeModal === 'due'} onClose={() => setActiveModal(null)} title="⏰ Due & Overdue Services">
                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Overdue', value: dueServices.filter(d => d.status === 'overdue').length, color: '#FF453A' },
                            { label: 'Due Soon', value: dueServices.filter(d => d.status === 'due_soon').length, color: '#FFD60A' },
                        ].map((s, i) => (
                            <div key={i} className="text-center rounded-xl p-3.5" style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}>
                                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                                <p className="text-[11px] mt-0.5" style={{ color: '#86868B' }}>{s.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    {['Customer', 'Phone', 'Vehicle', 'Last Service', 'Status', 'Days'].map(h => (
                                        <th key={h} className="pb-3 pr-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#5A5A6E' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {dueServices.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-8" style={{ color: '#5A5A6E' }}>🎉 No services are overdue or due soon!</td></tr>
                                ) : dueServices.map((d, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors" style={{
                                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                                        background: d.status === 'overdue' ? 'rgba(255,69,58,0.04)' : 'transparent',
                                    }}>
                                        <td className="py-2.5 pr-3 text-white font-medium text-[13px]">{d.name}</td>
                                        <td className="py-2.5 pr-3 font-mono text-[13px]" style={{ color: '#86868B' }}>{d.phone}</td>
                                        <td className="py-2.5 pr-3">
                                            <p className="text-white text-[13px]">{d.vehicle}</p>
                                            <p className="text-[11px]" style={{ color: '#5A5A6E' }}>{d.vehicleModel}</p>
                                        </td>
                                        <td className="py-2.5 pr-3 whitespace-nowrap" style={{ color: '#86868B' }}>{formatDate(d.lastServiceDate)}</td>
                                        <td className="py-2.5 pr-3 text-center">
                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{
                                                background: d.status === 'overdue' ? 'rgba(255,69,58,0.12)' : 'rgba(255,214,10,0.12)',
                                                color: d.status === 'overdue' ? '#FF453A' : '#FFD60A',
                                                border: `1px solid ${d.status === 'overdue' ? 'rgba(255,69,58,0.2)' : 'rgba(255,214,10,0.2)'}`,
                                            }}>{d.label}</span>
                                        </td>
                                        <td className="py-2.5 text-right font-bold" style={{ color: d.status === 'overdue' ? '#FF453A' : '#FFD60A' }}>
                                            {d.status === 'overdue' ? `${d.days}d overdue` : `${d.days}d left`}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {dueServices.length > 0 && (
                        <div className="rounded-xl p-3 text-[12px] text-center" style={{
                            background: 'rgba(0,122,255,0.06)',
                            border: '1px solid rgba(0,122,255,0.12)',
                            color: '#86868B',
                        }}>
                            💡 Service cycle is set to <strong className="text-white">{SERVICE_CYCLE_DAYS} days</strong>. Vehicles are flagged within 10 days of next service.
                        </div>
                    )}
                </div>
            </WideModal>
        </>
    );
}
