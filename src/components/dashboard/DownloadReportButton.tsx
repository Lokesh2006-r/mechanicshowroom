'use client';

import { Product } from '@/types';
import { useCallback, useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const getDateStr = () => new Date().toLocaleDateString().replace(/\//g, '-');

    const downloadPDF = useCallback(() => {
        const doc = new jsPDF();
        const date = new Date().toLocaleDateString();

        // Title
        doc.setFontSize(18);
        doc.text('Mechanical Workshop System Report', 14, 22);

        doc.setFontSize(11);
        doc.text(`Date: ${date}`, 14, 30);

        // Summary Statistics
        doc.setFontSize(14);
        doc.text('Summary Statistics', 14, 40);

        autoTable(doc, {
            startY: 45,
            head: [['Metric', 'Value']],
            body: [
                ['Total Revenue', `Rs. ${data.totalRevenue.toLocaleString()}`],
                ['Total Services Completed', data.totalServices],
                ['Current Stock Value', `Rs. ${data.stockValue.toLocaleString()}`],
            ],
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
        });

        // Low Stock Alerts
        let finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.text('Low Stock Alerts', 14, finalY);

        autoTable(doc, {
            startY: finalY + 5,
            head: [['Product Name', 'Category', 'Quantity', 'Min Alert']],
            body: data.lowStock.map(p => [p.name, p.category, p.quantity, p.minStockAlert]),
            theme: 'striped',
            headStyles: { fillColor: [192, 57, 43] },
        });

        // Predictions
        finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.text('Stock Predictions (Next 30 Days)', 14, finalY);

        autoTable(doc, {
            startY: finalY + 5,
            head: [['Product Name', 'Days Left', 'Daily Usage Rate']],
            body: data.stockPredictions.map(p => [p.product, p.daysLeft, p.dailyRate.toFixed(2)]),
            theme: 'striped',
            headStyles: { fillColor: [243, 156, 18] },
        });

        // Due Services
        finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.text('Upcoming / Overdue Services', 14, finalY);

        autoTable(doc, {
            startY: finalY + 5,
            head: [['Customer Name', 'Vehicle', 'Phone', 'Status', 'Message']],
            body: data.customersDue.map(c => [
                c.name,
                c.vehicle,
                c.phone,
                c.status.label,
                c.status.status === 'overdue' ? `Overdue by ${c.status.days} days` : `Due in ${c.status.days} days`
            ]),
            theme: 'striped',
            headStyles: { fillColor: [142, 68, 173] },
        });

        doc.save(`workshop_report_${getDateStr()}.pdf`);
        setIsOpen(false);
    }, [data]);

    const downloadExcel = useCallback(() => {
        const wb = XLSX.utils.book_new();

        // Summary Sheet
        const summaryData = [
            ['Metric', 'Value'],
            ['Total Revenue', data.totalRevenue],
            ['Total Services Completed', data.totalServices],
            ['Current Stock Value', data.stockValue],
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

        // Low Stock Sheet
        if (data.lowStock.length > 0) {
            const lowStockData = data.lowStock.map(p => ({
                Name: p.name,
                Category: p.category,
                Quantity: p.quantity,
                'Min Alert': p.minStockAlert
            }));
            const wsLowStock = XLSX.utils.json_to_sheet(lowStockData);
            XLSX.utils.book_append_sheet(wb, wsLowStock, "Low Stock");
        }

        // Predictions Sheet
        if (data.stockPredictions.length > 0) {
            const predictionData = data.stockPredictions.map(p => ({
                Product: p.product,
                'Days Left': p.daysLeft,
                'Daily Rate': p.dailyRate.toFixed(2)
            }));
            const wsPredictions = XLSX.utils.json_to_sheet(predictionData);
            XLSX.utils.book_append_sheet(wb, wsPredictions, "Predictions");
        }

        // Services Due Sheet
        if (data.customersDue.length > 0) {
            const dueData = data.customersDue.map(c => ({
                Customer: c.name,
                Vehicle: c.vehicle,
                Phone: c.phone,
                Status: c.status.label,
                Days: c.status.days,
                Message: c.status.status === 'overdue' ? `Overdue by ${c.status.days} days` : `Due in ${c.status.days} days`
            }));
            const wsDue = XLSX.utils.json_to_sheet(dueData);
            XLSX.utils.book_append_sheet(wb, wsDue, "Due Services");
        }

        XLSX.writeFile(wb, `workshop_report_${getDateStr()}.xlsx`);
        setIsOpen(false);
    }, [data]);

    const downloadCSV = useCallback(() => {
        const { totalRevenue, totalServices, stockValue, lowStock, stockPredictions, customersDue } = data;
        const date = new Date().toLocaleDateString();

        const escape = (field: any) => {
            const str = String(field ?? '');
            if (str.includes(',') || str.includes('\"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const rows = [
            ['MECHANICAL WORKSHOP SYSTEM REPORT'],
            [`Date: ${date}`],
            [],
            ['--- SUMMARY STATISTICS ---'],
            ['Metric', 'Value'],
            ['Total Revenue', `Rs. ${totalRevenue.toLocaleString()}`],
            ['Total Services Completed', totalServices],
            ['Current Stock Value', `Rs. ${stockValue.toLocaleString()}`],
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

        const csvString = rows.map(row => row.map(escape).join(",")).join("\n");
        const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvString);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `workshop_report_${getDateStr()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsOpen(false);
    }, [data]);

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn btn-secondary !px-3 !py-1.5 text-xs flex items-center gap-2 transition-transform active:scale-95"
            >
                <span>Download Report</span>
                <span className="text-[10px]">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 origin-top-right rounded-md bg-[#1a1a2e] border border-white/10 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-fade-in-up">
                    <div className="py-1">
                        <button
                            onClick={downloadPDF}
                            className="text-gray-300 hover:bg-white/5 block w-full text-left px-4 py-2 text-sm transition-colors"
                        >
                            Download PDF
                        </button>
                        <button
                            onClick={downloadExcel}
                            className="text-gray-300 hover:bg-white/5 block w-full text-left px-4 py-2 text-sm transition-colors"
                        >
                            Download Excel
                        </button>
                        <button
                            onClick={downloadCSV}
                            className="text-gray-300 hover:bg-white/5 block w-full text-left px-4 py-2 text-sm transition-colors"
                        >
                            Download CSV
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
