'use client';

import { useState } from 'react';
import { getFinancialReport } from '@/app/actions';

export default function ReportClient() {
    // Default range: First day of current month to Today
    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(today);
    const [stats, setStats] = useState<{
        totalRevenue: number;
        totalGST: number;
        serviceCount: number;
        laborRevenue: number; // Net
        partsRevenue: number; // Net
        laborGross: number;
        partsGross: number;
    } | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleGenerate() {
        setLoading(true);
        try {
            const data = await getFinancialReport(startDate, endDate);
            setStats(data);
        } catch (error) {
            console.error(error);
            alert("Failed to generate report");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Financial Reports</h1>
                    <p className="text-slate-400 text-sm mt-1">Generate revenue and performance reports</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/50">
                    <button
                        onClick={() => window.print()}
                        disabled={!stats}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span>🖨️</span> Print Report
                    </button>
                </div>
            </div>

            {/* Filter Section */}
            <div className="mac-window no-print">
                <div className="mac-window-titlebar">
                    <div className="mac-window-dots">
                        <span className="mac-window-dot red"></span>
                        <span className="mac-window-dot yellow"></span>
                        <span className="mac-window-dot green"></span>
                    </div>
                    <span className="mac-window-title">Date Range Selection</span>
                </div>
                <div className="mac-window-body flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="input-field w-full"
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="input-field w-full"
                        />
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full md:w-auto px-8 py-2.5 btn btn-primary h-[42px] flex items-center justify-center gap-2 min-w-[140px]"
                    >
                        {loading ? 'Generating...' : 'Run Report'}
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
                    {/* Total Revenue */}
                    <div className="glass-panel p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="text-6xl">💰</span>
                        </div>
                        <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Gross Revenue</p>
                        <p className="text-3xl font-bold text-white mt-1">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
                        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400">
                            <span className="bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                {stats.serviceCount} Services
                            </span>
                            <span className="text-slate-500">in selected period</span>
                        </div>
                    </div>

                    {/* Total GST */}
                    <div className="glass-panel p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="text-6xl">🏛️</span>
                        </div>
                        <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Taxes (GST)</p>
                        <p className="text-3xl font-bold text-white mt-1">₹{stats.totalGST.toLocaleString('en-IN')}</p>
                        <div className="mt-4 text-xs text-slate-500">
                            Collected on parts & labor
                        </div>
                    </div>

                    {/* Net Earnings */}
                    <div className="glass-panel p-6 relative overflow-hidden group bg-gradient-to-br from-blue-900/40 to-slate-900/40">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="text-6xl">📈</span>
                        </div>
                        <p className="text-sm font-medium text-blue-300 uppercase tracking-wider">Net Sales (Excl. Tax)</p>
                        <p className="text-3xl font-bold text-white mt-1">₹{(stats.totalRevenue - stats.totalGST).toLocaleString('en-IN')}</p>
                        <div className="mt-4 text-xs text-slate-400">
                            Actual Revenue for Shop
                        </div>
                    </div>

                    {/* Labor vs Parts */}
                    <div className="glass-panel p-6 col-span-1 md:col-span-2 lg:col-span-3">
                        <h3 className="text-lg font-bold text-white mb-4">Revenue Breakdown</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Labor */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-300">Labor / Services (Net)</span>
                                    <span className="text-white font-mono">₹{stats.laborRevenue.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full"
                                        style={{ width: `${(stats.laborRevenue / (stats.totalRevenue - stats.totalGST || 1)) * 100}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-slate-500 text-right">
                                    Gross (Inc. 18% GST): ₹{stats.laborGross.toLocaleString('en-IN')}
                                </p>
                            </div>

                            {/* Parts */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-300">Parts / Inventory (Net)</span>
                                    <span className="text-white font-mono">₹{stats.partsRevenue.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-amber-500 rounded-full"
                                        style={{ width: `${(stats.partsRevenue / (stats.totalRevenue - stats.totalGST || 1)) * 100}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-slate-500 text-right">
                                    Gross (Inc. GST): ₹{stats.partsGross.toLocaleString('en-IN')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!stats && !loading && (
                <div className="text-center py-20 text-slate-500">
                    Select a date range and click "Run Report" to view financials.
                </div>
            )}

            {/* Print Styling - Only visible when printing */}
            <style jsx global>{`
                @media print {
                    @page { margin: 2cm; }
                    body { background: white !important; color: black !important; }
                    .no-print, nav, aside { display: none !important; }
                    .glass-panel, .mac-window { 
                        background: none !important; 
                        border: 1px solid #ddd !important; 
                        box-shadow: none !important;
                        color: black !important;
                    }
                    .text-white { color: black !important; }
                    .text-slate-400, .text-slate-500 { color: #666 !important; }
                    .bg-slate-800 { background: #f0f0f0 !important; }
                }
            `}</style>
        </div>
    );
}
