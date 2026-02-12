'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Product, Customer } from '@/types';
import { useRouter } from 'next/navigation';
import { MECHANICS_LIST } from '@/lib/constants';

// --------------- Invoice HTML Generator ---------------
function generateInvoiceHTML({
    customer, vehicle, serviceDate, serviceType, mechanic, notes,
    serviceCharge, parts, products, partsTotal, gstTotal, grandTotal
}: {
    customer: Customer;
    vehicle: { vehicleNumber: string; modelName: string; vehicleType: string };
    serviceDate: string;
    serviceType: string;
    mechanic: string;
    notes: string;
    serviceCharge: number;
    parts: { productId: string; quantity: number }[];
    products: Product[];
    partsTotal: number;
    gstTotal: number;
    grandTotal: number;
}) {
    const invoiceNo = `INV-${Date.now().toString(36).toUpperCase()}`;
    const formattedDate = new Date(serviceDate).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });

    const partsRows = parts.map(p => {
        const product = products.find(pr => pr.id === p.productId);
        if (!product) return '';
        const lineTotal = product.price * p.quantity;
        const gst = lineTotal * (product.gstRate / 100);
        return `
            <tr>
                <td style="padding:10px 14px;border-bottom:1px solid #e8e8ed;color:#1d1d1f;font-size:13px;">${product.name}</td>
                <td style="padding:10px 14px;border-bottom:1px solid #e8e8ed;text-align:center;color:#86868b;font-size:13px;">${p.quantity}</td>
                <td style="padding:10px 14px;border-bottom:1px solid #e8e8ed;text-align:right;color:#1d1d1f;font-size:13px;">₹${product.price.toFixed(2)}</td>
                <td style="padding:10px 14px;border-bottom:1px solid #e8e8ed;text-align:right;color:#86868b;font-size:13px;">${product.gstRate}%</td>
                <td style="padding:10px 14px;border-bottom:1px solid #e8e8ed;text-align:right;color:#1d1d1f;font-weight:600;font-size:13px;">₹${(lineTotal + gst).toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    const serviceGst = serviceCharge * 0.18;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Invoice ${invoiceNo}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', -apple-system, sans-serif; background: #f5f5f7; color: #1d1d1f; }
            .invoice { max-width: 800px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #1a1a2e 0%, #2d2d5e 100%); color: white; padding: 40px; display: flex; justify-content: space-between; align-items: flex-start; }
            .header h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
            .header .subtitle { color: rgba(255,255,255,0.6); font-size: 12px; margin-top: 4px; }
            .invoice-meta { text-align: right; }
            .invoice-meta .inv-no { font-size: 18px; font-weight: 700; color: #007AFF; background: rgba(0,122,255,0.15); padding: 4px 12px; border-radius: 8px; display: inline-block; margin-bottom: 8px; }
            .invoice-meta .date { color: rgba(255,255,255,0.7); font-size: 13px; }
            .details { display: flex; gap: 40px; padding: 32px 40px; background: #fafafa; border-bottom: 1px solid #e8e8ed; }
            .detail-block h4 { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #86868b; margin-bottom: 8px; }
            .detail-block p { font-size: 14px; color: #1d1d1f; line-height: 1.6; }
            .detail-block p span { color: #86868b; }
            .service-badge { display: inline-block; background: rgba(0,122,255,0.1); color: #007AFF; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 6px; border: 1px solid rgba(0,122,255,0.15); }
            .table-section { padding: 32px 40px; }
            .table-section h3 { font-size: 14px; font-weight: 600; color: #1d1d1f; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th { padding: 10px 14px; text-align: left; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #86868b; border-bottom: 2px solid #e8e8ed; background: #fafafa; }
            th:last-child, th:nth-child(3), th:nth-child(4) { text-align: right; }
            th:nth-child(2) { text-align: center; }
            .totals { padding: 0 40px 32px; display: flex; justify-content: flex-end; }
            .totals-box { width: 280px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #86868b; }
            .total-row.main { border-top: 2px solid #1d1d1f; margin-top: 8px; padding-top: 14px; font-size: 18px; font-weight: 700; color: #1d1d1f; }
            .total-row.main span:last-child { color: #007AFF; }
            .footer { background: #fafafa; border-top: 1px solid #e8e8ed; padding: 24px 40px; display: flex; justify-content: space-between; align-items: center; }
            .footer p { font-size: 11px; color: #86868b; }
            .footer .thank { font-size: 13px; font-weight: 600; color: #1d1d1f; }
            ${notes ? `.notes { margin: 0 40px 24px; padding: 14px 18px; background: #fafafa; border-radius: 10px; border: 1px solid #e8e8ed; }
            .notes h4 { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #86868b; margin-bottom: 6px; }
            .notes p { font-size: 13px; color: #1d1d1f; }` : ''}
            @media print {
                body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .invoice { margin: 0; box-shadow: none; border-radius: 0; }
                .no-print { display: none !important; }
            }
        </style>
    </head>
    <body>
        <div class="invoice">
            <div class="header">
                <div>
                    <h1>🔧 Mechanic Pro Shop</h1>
                    <p class="subtitle">Workshop Management System</p>
                </div>
                <div class="invoice-meta">
                    <div class="inv-no">${invoiceNo}</div>
                    <p class="date">${formattedDate}</p>
                </div>
            </div>

            <div class="details">
                <div class="detail-block" style="flex:1;">
                    <h4>Customer</h4>
                    <p><strong>${customer.name}</strong></p>
                    <p>📞 ${customer.phone}</p>
                    ${customer.email ? `<p>✉ ${customer.email}</p>` : ''}
                    ${customer.address ? `<p><span>${customer.address}</span></p>` : ''}
                </div>
                <div class="detail-block" style="flex:1;">
                    <h4>Vehicle</h4>
                    <p><strong>${vehicle.vehicleNumber}</strong></p>
                    <p>${vehicle.modelName}</p>
                    <p><span>${vehicle.vehicleType}</span></p>
                </div>
                <div class="detail-block">
                    <h4>Service</h4>
                    <p><span class="service-badge">${serviceType}</span></p>
                    ${mechanic ? `<p style="margin-top:8px;">Mechanic: <strong>${mechanic}</strong></p>` : ''}
                </div>
            </div>

            <div class="table-section">
                <h3>Service & Parts Breakdown</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>GST</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding:10px 14px;border-bottom:1px solid #e8e8ed;color:#1d1d1f;font-size:13px;">
                                <strong>Labor — ${serviceType}</strong>
                            </td>
                            <td style="padding:10px 14px;border-bottom:1px solid #e8e8ed;text-align:center;color:#86868b;font-size:13px;">1</td>
                            <td style="padding:10px 14px;border-bottom:1px solid #e8e8ed;text-align:right;color:#1d1d1f;font-size:13px;">₹${serviceCharge.toFixed(2)}</td>
                            <td style="padding:10px 14px;border-bottom:1px solid #e8e8ed;text-align:right;color:#86868b;font-size:13px;">18%</td>
                            <td style="padding:10px 14px;border-bottom:1px solid #e8e8ed;text-align:right;color:#1d1d1f;font-weight:600;font-size:13px;">₹${(serviceCharge + serviceGst).toFixed(2)}</td>
                        </tr>
                        ${partsRows}
                    </tbody>
                </table>
            </div>

            ${notes ? `<div class="notes"><h4>Service Notes</h4><p>${notes}</p></div>` : ''}

            <div class="totals">
                <div class="totals-box">
                    <div class="total-row"><span>Subtotal</span><span>₹${(serviceCharge + partsTotal).toFixed(2)}</span></div>
                    <div class="total-row"><span>GST</span><span>₹${gstTotal.toFixed(2)}</span></div>
                    <div class="total-row main"><span>Grand Total</span><span>₹${grandTotal.toFixed(2)}</span></div>
                </div>
            </div>

            <div class="footer">
                <p class="thank">Thank you for your business!</p>
                <p>Mechanic Pro Shop • Workshop Management System</p>
            </div>
        </div>
    </body>
    </html>`;
}


// --------------- Main Component ---------------
export default function BillingClient({ products, customers }: { products: Product[], customers: Customer[] }) {
    const router = useRouter();
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [selectedVehicleId, setSelectedVehicleId] = useState('');
    const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);

    const [serviceType, setServiceType] = useState('General Service');
    const [mechanic, setMechanic] = useState('');
    const [serviceCharge, setServiceCharge] = useState(500);
    const [notes, setNotes] = useState('');
    const [parts, setParts] = useState<{ productId: string; quantity: number }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Customer search state
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const customerSearchRef = useRef<HTMLDivElement>(null);

    // Filter customers based on search query
    const filteredCustomers = useMemo(() => {
        if (!customerSearch.trim()) return customers;
        const query = customerSearch.toLowerCase();
        return customers.filter(c =>
            c.name.toLowerCase().includes(query) ||
            c.phone.includes(query) ||
            (c.email && c.email.toLowerCase().includes(query))
        );
    }, [customerSearch, customers]);

    // Close customer dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (customerSearchRef.current && !customerSearchRef.current.contains(event.target as Node)) {
                setShowCustomerDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectCustomer = (customer: Customer) => {
        setSelectedCustomerId(customer.id);
        setSelectedVehicleId('');
        setCustomerSearch(`${customer.name} (${customer.phone})`);
        setShowCustomerDropdown(false);
    };

    const handleClearCustomer = () => {
        setSelectedCustomerId('');
        setSelectedVehicleId('');
        setCustomerSearch('');
    };

    // Derived state for totals
    const partsTotal = useMemo(() => {
        return parts.reduce((sum, item) => {
            const product = products.find(p => p.id === item.productId);
            return sum + (product ? product.price * item.quantity : 0);
        }, 0);
    }, [parts, products]);

    const gstTotal = useMemo(() => {
        let pGst = 0;
        parts.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                pGst += (product.price * item.quantity) * (product.gstRate / 100);
            }
        });
        const sGst = serviceCharge * 0.18;
        return pGst + sGst;
    }, [parts, products, serviceCharge]);

    const grandTotal = useMemo(() => {
        return serviceCharge + partsTotal + gstTotal;
    }, [serviceCharge, partsTotal, gstTotal]);

    function addPartLine() {
        setParts([...parts, { productId: '', quantity: 1 }]);
    }

    function removePartLine(index: number) {
        const newParts = [...parts];
        newParts.splice(index, 1);
        setParts(newParts);
    }

    function updatePartLine(index: number, field: 'productId' | 'quantity', value: any) {
        const newParts = [...parts];
        newParts[index] = { ...newParts[index], [field]: value };
        setParts(newParts);
    }

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
    const customerVehicles = selectedCustomer ? selectedCustomer.vehicles : [];
    const selectedVehicle = customerVehicles.find(v => v.id === selectedVehicleId);

    // ---- Invoice Data helper ----
    const getInvoiceData = useCallback(() => {
        if (!selectedCustomer || !selectedVehicle) return null;
        return {
            customer: selectedCustomer,
            vehicle: selectedVehicle,
            serviceDate,
            serviceType,
            mechanic,
            notes,
            serviceCharge,
            parts: parts.filter(p => p.productId),
            products,
            partsTotal,
            gstTotal,
            grandTotal,
        };
    }, [selectedCustomer, selectedVehicle, serviceDate, serviceType, mechanic, notes, serviceCharge, parts, products, partsTotal, gstTotal, grandTotal]);

    // ---- Print Invoice ----
    const handlePrintInvoice = useCallback(() => {
        const data = getInvoiceData();
        if (!data) return alert('Please select a customer and vehicle first.');
        const html = generateInvoiceHTML(data);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
            }, 500);
        }
    }, [getInvoiceData]);

    // ---- Download Invoice as PDF ----
    const handleDownloadInvoice = useCallback(() => {
        const data = getInvoiceData();
        if (!data) return alert('Please select a customer and vehicle first.');
        const html = generateInvoiceHTML(data);

        // Open in new window with save prompt instructions
        const dlWindow = window.open('', '_blank');
        if (dlWindow) {
            const wrappedHtml = html.replace('</body>', `
                <div class="no-print" style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);backdrop-filter:blur(20px);color:white;padding:12px 24px;border-radius:12px;font-size:13px;font-family:Inter,sans-serif;z-index:999;box-shadow:0 8px 32px rgba(0,0,0,0.3);display:flex;align-items:center;gap:10px;border:1px solid rgba(255,255,255,0.1);">
                    <span style="font-size:18px;">💡</span>
                    <span>Press <strong>Ctrl+P</strong> → Select <strong>"Save as PDF"</strong> to download</span>
                    <button onclick="window.print()" style="margin-left:12px;background:#007AFF;color:white;border:none;padding:6px 16px;border-radius:8px;cursor:pointer;font-weight:600;font-size:12px;box-shadow:0 1px 4px rgba(0,122,255,0.3);">Save as PDF</button>
                </div>
            </body>`);
            dlWindow.document.write(wrappedHtml);
            dlWindow.document.close();
        }
    }, [getInvoiceData]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedCustomerId) return alert('Select a customer');
        if (!selectedVehicleId) return alert('Select a vehicle');

        setIsSubmitting(true);
        try {
            const { saveService } = await import('@/app/actions');
            await saveService(selectedCustomerId, selectedVehicleId, {
                date: new Date(serviceDate).toISOString(),
                type: serviceType,
                mechanic,
                serviceCharge,
                parts,
                notes
            });
            alert('Service Invoice Created Successfully!');
            router.push('/customers');
            router.refresh();
        } catch (err: any) {
            alert(err.message || 'Failed to create invoice');
        } finally {
            setIsSubmitting(false);
        }
    }

    const isFormReady = !!selectedCustomerId && !!selectedVehicleId;

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Form Section */}
            <div className="flex-1 space-y-6">

                {/* Customer & Vehicle Selection */}
                <div className="mac-window">
                    <div className="mac-window-titlebar">
                        <div className="mac-window-dots">
                            <span className="mac-window-dot red"></span>
                            <span className="mac-window-dot yellow"></span>
                            <span className="mac-window-dot green"></span>
                        </div>
                        <span className="mac-window-title">Customer & Vehicle</span>
                    </div>
                    <div className="mac-window-body">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Searchable Customer Input */}
                            <div ref={customerSearchRef} className="relative">
                                <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#86868B' }}>Search Customer</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="w-4 h-4" style={{ color: '#5A5A6E' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg p-2.5 pl-10 pr-10 text-[13px] text-white"
                                        style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)' }}
                                        placeholder="Type name, phone, or email..."
                                        value={customerSearch}
                                        onChange={e => {
                                            setCustomerSearch(e.target.value);
                                            setShowCustomerDropdown(true);
                                            if (!e.target.value.trim()) handleClearCustomer();
                                        }}
                                        onFocus={() => setShowCustomerDropdown(true)}
                                    />
                                    {selectedCustomerId && (
                                        <button type="button" onClick={handleClearCustomer}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center transition-colors"
                                            style={{ color: '#86868B' }}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                {/* Customer Search Dropdown */}
                                {showCustomerDropdown && !selectedCustomerId && (
                                    <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto rounded-xl" style={{
                                        background: 'rgba(30, 30, 56, 0.95)',
                                        backdropFilter: 'blur(40px)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                                    }}>
                                        {filteredCustomers.length === 0 ? (
                                            <div className="p-4 text-center text-[13px]" style={{ color: '#5A5A6E' }}>
                                                No customers found matching &quot;{customerSearch}&quot;
                                            </div>
                                        ) : (
                                            filteredCustomers.map(c => (
                                                <button key={c.id} type="button" onClick={() => handleSelectCustomer(c)}
                                                    className="w-full text-left px-4 py-3 hover:bg-white/[0.04] transition-colors flex items-center gap-3"
                                                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                                        style={{ background: 'linear-gradient(135deg, #007AFF, #5856D6)' }}>
                                                        {c.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white text-[13px] font-medium truncate">{c.name}</p>
                                                        <p className="text-[11px] truncate" style={{ color: '#86868B' }}>
                                                            📞 {c.phone}
                                                            {c.email && ` · ✉ ${c.email}`}
                                                            {c.vehicles.length > 0 && ` · 🚗 ${c.vehicles.length} vehicle${c.vehicles.length > 1 ? 's' : ''}`}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}

                                {/* Selected customer indicator */}
                                {selectedCustomer && (
                                    <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{
                                        background: 'rgba(48,209,88,0.08)', border: '1px solid rgba(48,209,88,0.15)',
                                    }}>
                                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: '#30D158' }}>✓</div>
                                        <span className="text-[12px] font-medium" style={{ color: '#30D158' }}>{selectedCustomer.name} selected</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#86868B' }}>Select Vehicle</label>
                                <select
                                    value={selectedVehicleId}
                                    onChange={e => setSelectedVehicleId(e.target.value)}
                                    className="w-full rounded-lg p-2.5 text-[13px] text-white"
                                    style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}
                                    disabled={!selectedCustomerId}
                                >
                                    <option value="">-- Choose Vehicle --</option>
                                    {customerVehicles.map(v => (
                                        <option key={v.id} value={v.id}>{v.vehicleNumber} - {v.modelName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Show selected details */}
                        {selectedCustomer && selectedVehicleId && (() => {
                            const vehicle = customerVehicles.find(v => v.id === selectedVehicleId);
                            return vehicle ? (
                                <div className="mt-4 p-3 rounded-xl flex justify-between items-center" style={{
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)',
                                }}>
                                    <div>
                                        <p className="text-white font-medium text-[13px]">{selectedCustomer.name}</p>
                                        <p className="text-[12px]" style={{ color: '#86868B' }}>{selectedCustomer.phone}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-[13px]" style={{ color: '#30D158' }}>{vehicle.vehicleNumber}</p>
                                        <p className="text-[12px]" style={{ color: '#86868B' }}>{vehicle.modelName} • {vehicle.vehicleType}</p>
                                    </div>
                                </div>
                            ) : null;
                        })()}
                    </div>
                </div>

                {/* Service Info */}
                <div className="mac-window">
                    <div className="mac-window-titlebar">
                        <div className="mac-window-dots">
                            <span className="mac-window-dot red"></span>
                            <span className="mac-window-dot yellow"></span>
                            <span className="mac-window-dot green"></span>
                        </div>
                        <span className="mac-window-title">Service Details</span>
                    </div>
                    <div className="mac-window-body">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#86868B' }}>Service Date</label>
                                <input type="date" value={serviceDate} onChange={e => setServiceDate(e.target.value)}
                                    className="w-full rounded-lg p-2.5 text-[13px] text-white"
                                    style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }} />
                            </div>
                            <div>
                                <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#86868B' }}>Service Type</label>
                                <select value={serviceType} onChange={e => setServiceType(e.target.value)}
                                    className="w-full rounded-lg p-2.5 text-[13px] text-white"
                                    style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <option>General Service</option>
                                    <option>Oil Change</option>
                                    <option>Brake Repair</option>
                                    <option>Engine Tuning</option>
                                    <option>Washing / Cleaning</option>
                                    <option>Inspection</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#86868B' }}>Assigned Mechanic</label>
                                <select value={mechanic} onChange={e => setMechanic(e.target.value)}
                                    className="w-full rounded-lg p-2.5 text-[13px] text-white"
                                    style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <option value="">-- Select Mechanic --</option>
                                    {MECHANICS_LIST.map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#86868B' }}>Labor Charge (₹)</label>
                                <input type="number" value={serviceCharge} onChange={e => setServiceCharge(parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-lg p-2.5 text-[13px] text-white text-right font-mono"
                                    style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }} />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#86868B' }}>Service Notes</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                                    className="w-full rounded-lg p-2.5 text-[13px] text-white"
                                    style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}
                                    rows={2} placeholder="Additional details..." />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Parts Usage */}
                <div className="mac-window">
                    <div className="mac-window-titlebar">
                        <div className="mac-window-dots">
                            <span className="mac-window-dot red"></span>
                            <span className="mac-window-dot yellow"></span>
                            <span className="mac-window-dot green"></span>
                        </div>
                        <span className="mac-window-title">Parts & Inventory</span>
                        <button type="button" onClick={addPartLine}
                            className="text-[11px] font-medium px-3 py-1 rounded-md transition-all"
                            style={{ background: '#007AFF', color: 'white', boxShadow: '0 1px 3px rgba(0,122,255,0.3)' }}>
                            + Add Part
                        </button>
                    </div>
                    <div className="mac-window-body">
                        <div className="space-y-3">
                            {parts.map((part, index) => {
                                const product = products.find(p => p.id === part.productId);
                                const maxStock = product ? product.quantity : 0;

                                return (
                                    <div key={index} className="flex gap-2 items-start">
                                        <div className="flex-grow">
                                            <select value={part.productId} onChange={e => updatePartLine(index, 'productId', e.target.value)}
                                                className="w-full rounded-lg p-2.5 text-[13px] text-white"
                                                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <option value="">Select Part...</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                                                        {p.name} (Stock: {p.quantity}) - ₹{p.price}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-20">
                                            <input type="number" min="1" max={maxStock} value={part.quantity}
                                                onChange={e => updatePartLine(index, 'quantity', parseInt(e.target.value))}
                                                className="w-full rounded-lg p-2.5 text-[13px] text-white text-right"
                                                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }} />
                                        </div>
                                        <button onClick={() => removePartLine(index)} className="px-2 pt-2 transition-colors" style={{ color: '#FF453A' }}>🗑</button>
                                    </div>
                                );
                            })}
                            {parts.length === 0 && <p className="text-[13px] italic py-2" style={{ color: '#5A5A6E' }}>No spare parts selected.</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoice Summary Sidebar */}
            <div className="w-full lg:w-96">
                <div className="mac-window sticky top-6">
                    <div className="mac-window-titlebar">
                        <div className="mac-window-dots">
                            <span className="mac-window-dot red"></span>
                            <span className="mac-window-dot yellow"></span>
                            <span className="mac-window-dot green"></span>
                        </div>
                        <span className="mac-window-title">Billing Summary</span>
                    </div>
                    <div className="mac-window-body">
                        <div className="space-y-3 text-[13px]">
                            <div className="flex justify-between" style={{ color: '#86868B' }}>
                                <span>Service Labor</span>
                                <span className="font-mono">₹{serviceCharge.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between" style={{ color: '#86868B' }}>
                                <span>Parts Total</span>
                                <span className="font-mono">₹{partsTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between" style={{ color: '#86868B' }}>
                                <span>GST (Approx)</span>
                                <span className="font-mono">₹{gstTotal.toFixed(2)}</span>
                            </div>

                            <div className="pt-3 mt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                <div className="flex justify-between text-lg font-bold text-white">
                                    <span>Total</span>
                                    <span style={{ color: '#30D158' }}>₹{grandTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6 space-y-2.5">
                            {/* Generate Invoice — Primary */}
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !selectedCustomerId}
                                className="w-full py-3 rounded-xl text-[13px] font-semibold text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                                style={{
                                    background: '#007AFF',
                                    boxShadow: '0 2px 12px rgba(0,122,255,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
                                }}
                            >
                                {isSubmitting ? 'Processing...' : '📄 Generate Invoice'}
                            </button>

                            {/* Print & Download row */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={handlePrintInvoice}
                                    disabled={!isFormReady}
                                    className="py-2.5 rounded-xl text-[12px] font-semibold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-1.5"
                                    style={{
                                        background: 'rgba(255,255,255,0.06)',
                                        color: isFormReady ? '#F5F5F7' : '#5A5A6E',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                    }}
                                >
                                    <span>🖨️</span> Print
                                </button>
                                <button
                                    onClick={handleDownloadInvoice}
                                    disabled={!isFormReady}
                                    className="py-2.5 rounded-xl text-[12px] font-semibold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-1.5"
                                    style={{
                                        background: 'rgba(48,209,88,0.1)',
                                        color: isFormReady ? '#30D158' : '#5A5A6E',
                                        border: '1px solid rgba(48,209,88,0.15)',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                    }}
                                >
                                    <span>⬇️</span> Download
                                </button>
                            </div>
                        </div>

                        {!selectedCustomerId && (
                            <p className="text-center text-[11px] mt-3" style={{ color: '#FF453A' }}>Select a customer to proceed</p>
                        )}

                        {isFormReady && (
                            <p className="text-center text-[11px] mt-3" style={{ color: '#5A5A6E' }}>
                                💡 Print / Download creates a preview before saving
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
