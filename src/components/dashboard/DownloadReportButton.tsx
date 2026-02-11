'use client';

import { Product } from '@/types';
import { useCallback } from 'react';

interface ReportData {
    totalRevenue: number;
    totalServices: number;
    stockValue: number;
    lowStock: Product[];
    stockPredictions: { product: string; daysLeft: number; dailyRate: number }[];
    customersDue: {
        name: string;
        vehicle: string;
        phone: string;
        status: {
            status: string;
            days: number;
            label: string;
        };
    }[];
}

export default function DownloadReportButton({ data }: { data: ReportData }) {
    const handleDownload = useCallback(() => {
        const { totalRevenue, totalServices, stockValue, lowStock, stockPredictions, customersDue } = data;
        const date = new Date().toLocaleDateString();

        // Helper to escape CSV fields
        const escape = (field: any) => {
            const str = String(field ?? '');
            if (str.includes(',') || str.includes('\"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        // CSV Content Generation
        const rows = [
            ['MECHANICAL WORKSHOP SYSTEM REPORT'],
            [`Date: ${date}`],
            [],
            ['--- SUMMARY STATISTICS ---'],
            ['Metric', 'Value'],
            ['Total Revenue', `₹${totalRevenue.toLocaleString()}`],
            ['Total Services Completed', totalServices],
            ['Current Stock Value', `₹${stockValue.toLocaleString()}`],
            [],
            ['--- LOW STOCK ALERTS ---'],
            ['Product Name', 'Category', 'Quantity', 'Min Alert'],
            ...lowStock.map(p => [p.name, p.category, p.quantity, p.minStockAlert]),
            [],
            ['--- PREDICTED STOCKOUTS (Next 30 Days) ---'],
            ['Product Name', 'Days Left', 'Daily Usage Rate'],
            ...stockPredictions.map(p => [p.product, p.daysLeft, p.dailyRate.toFixed(2)]),
            [],
            ['--- UPCOMING / OVERDUE SERVICES ---'],
            ['Customer Name', 'Vehicle', 'Phone', 'Status', 'Days'],
            ...customersDue.map(c => [
                c.name,
                c.vehicle,
                c.phone,
                c.status.label,
                c.status.status === 'overdue' ? `Overdue by ${c.status.days} days` : `Due in ${c.status.days} days`
            ]),
        ];

        // Convert to CSV string with proper escaping
        const csvString = rows.map(row => row.map(escape).join(",")).join("\n");
        const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvString);

        // Trigger Download
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `workshop_report_${date.replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [data]);

    return (
        <button
            onClick={handleDownload}
            className="btn btn-secondary !px-3 !py-1.5 text-xs flex-1 md:flex-none transition-transform active:scale-95"
        >
            Download Report
        </button>
    );
}
