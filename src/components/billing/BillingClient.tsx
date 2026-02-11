'use client';

import { useState, useMemo } from 'react';
import { Product, Customer } from '@/types';
import { useRouter } from 'next/navigation';

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

    // Derived state for totals
    const partsTotal = useMemo(() => {
        return parts.reduce((sum, item) => {
            const product = products.find(p => p.id === item.productId);
            return sum + (product ? product.price * item.quantity : 0);
        }, 0);
    }, [parts, products]);

    // Approx calculated GST for display (Server will recalculate strictly)
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

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Form Section */}
            <div className="flex-1 space-y-6">

                {/* Customer Selection */}
                {/* ... */}

                {/* Service Info */}
                <div className="glass-panel">
                    <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2">Service Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Service Date</label>
                            <input
                                type="date"
                                value={serviceDate}
                                onChange={e => setServiceDate(e.target.value)}
                                className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Service Type</label>
                            <select
                                value={serviceType}
                                onChange={e => setServiceType(e.target.value)}
                                className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white"
                            >
                                <option>General Service</option>
                                <option>Oil Change</option>
                                <option>Brake Repair</option>
                                <option>Engine Tuning</option>
                                <option>Washing / Cleaning</option>
                                <option>Inspection</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Assigned Mechanic</label>
                            <input
                                value={mechanic}
                                onChange={e => setMechanic(e.target.value)}
                                className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white"
                                placeholder="Mechanic Name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Labor Charge (₹)</label>
                            <input
                                type="number"
                                value={serviceCharge}
                                onChange={e => setServiceCharge(parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white text-right font-mono"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm text-slate-400 mb-1">Service Notes</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white"
                                rows={2}
                                placeholder="Additional details..."
                            />
                        </div>
                    </div>
                </div>

                {/* Parts Usage */}
                <div className="glass-panel">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                        <h3 className="text-lg font-bold text-white">Parts & Inventory</h3>
                        <button type="button" onClick={addPartLine} className="text-xs bg-blue-600 px-3 py-1 rounded text-white hover:bg-blue-500">
                            + Add Part
                        </button>
                    </div>

                    <div className="space-y-3">
                        {parts.map((part, index) => {
                            const product = products.find(p => p.id === part.productId);
                            const maxStock = product ? product.quantity : 0;

                            return (
                                <div key={index} className="flex gap-2 items-start">
                                    <div className="flex-grow">
                                        <select
                                            value={part.productId}
                                            onChange={e => updatePartLine(index, 'productId', e.target.value)}
                                            className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white text-sm"
                                        >
                                            <option value="">Select Part...</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                                                    {p.name} (Stock: {p.quantity}) - ₹{p.price}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-20">
                                        <input
                                            type="number"
                                            min="1"
                                            max={maxStock}
                                            value={part.quantity}
                                            onChange={e => updatePartLine(index, 'quantity', parseInt(e.target.value))}
                                            className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white text-right text-sm"
                                        />
                                    </div>
                                    <button onClick={() => removePartLine(index)} className="text-red-400 hover:text-red-300 px-2 pt-2">🗑</button>
                                </div>
                            );
                        })}
                        {parts.length === 0 && <p className="text-slate-500 text-sm italic py-2">No spare parts selected.</p>}
                    </div>
                </div>
            </div>

            {/* Invoice Summary Sidebar */}
            <div className="w-full lg:w-96">
                <div className="glass-panel sticky top-6">
                    <h3 className="text-lg font-bold text-white mb-6">Billing Summary</h3>

                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between text-slate-300">
                            <span>Service Labor</span>
                            <span>₹{serviceCharge.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                            <span>Parts Total</span>
                            <span>₹{partsTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                            <span>GST (Approx)</span>
                            <span>₹{gstTotal.toFixed(2)}</span>
                        </div>

                        <div className="border-t border-slate-600 pt-4 mt-4">
                            <div className="flex justify-between text-xl font-bold text-white">
                                <span>Total</span>
                                <span className="text-emerald-400">₹{grandTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedCustomerId}
                        className="w-full btn btn-primary mt-8 py-4 text-lg shadow-xl"
                    >
                        {isSubmitting ? 'Processing...' : 'Generate Invoice'}
                    </button>

                    {!selectedCustomerId && (
                        <p className="text-center text-red-400 text-xs mt-2">Select a customer to proceed</p>
                    )}
                </div>
            </div>
        </div>
    );
}
