'use client';

import { useState, useMemo } from 'react';
import { Customer, Product } from '@/types';
import { saveService } from '@/app/actions';
import { useRouter } from 'next/navigation';

interface ServiceFormProps {
    customers: Customer[];
    products: Product[];
}

export default function ServiceForm({ customers, products }: ServiceFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        customerId: '',
        vehicleId: '',
        date: new Date().toISOString().split('T')[0],
        type: 'General Service',
        mechanic: '',
        serviceCharge: 0,
        notes: ''
    });

    const [selectedParts, setSelectedParts] = useState<{ productId: string; quantity: number }[]>([]);

    const selectedCustomer = customers.find(c => c.id === formData.customerId);
    const availableVehicles = selectedCustomer?.vehicles || [];

    // Calculations
    const financials = useMemo(() => {
        let partsCost = 0;
        let partsGst = 0;

        selectedParts.forEach(part => {
            const product = products.find(p => p.id === part.productId);
            if (product) {
                const cost = product.price * part.quantity;
                const gst = cost * (product.gstRate / 100);
                partsCost += cost;
                partsGst += gst;
            }
        });

        const serviceCharge = Number(formData.serviceCharge) || 0;
        const serviceGst = serviceCharge * 0.18;
        const totalGst = partsGst + serviceGst;
        const totalCost = partsCost + serviceCharge + totalGst;

        return { partsCost, partsGst, serviceCharge, serviceGst, totalGst, totalCost };
    }, [selectedParts, formData.serviceCharge, products]);

    const handleAddPart = () => {
        setSelectedParts([...selectedParts, { productId: '', quantity: 1 }]);
    };

    const handleRemovePart = (index: number) => {
        const newParts = [...selectedParts];
        newParts.splice(index, 1);
        setSelectedParts(newParts);
    };

    const handlePartChange = (index: number, field: 'productId' | 'quantity', value: string) => {
        const newParts = [...selectedParts];
        if (field === 'productId') {
            newParts[index].productId = value;
        } else {
            const qty = parseInt(value);
            // Stock Check
            if (newParts[index].productId) {
                const product = products.find(p => p.id === newParts[index].productId);
                if (product && qty > product.quantity) {
                    alert(`Only ${product.quantity} items available in stock!`);
                    return;
                }
            }
            newParts[index].quantity = qty > 0 ? qty : 1;
        }
        setSelectedParts(newParts);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!formData.customerId || !formData.vehicleId) {
            setError('Please select a customer and vehicle.');
            setLoading(false);
            return;
        }

        try {
            await saveService(formData.customerId, formData.vehicleId, {
                date: new Date(formData.date).toISOString(),
                type: formData.type,
                mechanic: formData.mechanic,
                serviceCharge: Number(formData.serviceCharge),
                parts: selectedParts.filter(p => p.productId),
                notes: formData.notes
            });
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Failed to save service record.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            {error && (
                <div className="p-4 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg">
                    {error}
                </div>
            )}

            {/* Customer & Vehicle Selection */}
            <div className="glass-panel p-6 space-y-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-blue-400">👤</span> Customer & Vehicle
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-slate-400 mb-2 text-sm">Select Customer</label>
                        <select
                            className="input-field w-full"
                            value={formData.customerId}
                            onChange={e => setFormData({ ...formData, customerId: e.target.value, vehicleId: '' })}
                            required
                        >
                            <option value="">-- Choose Customer --</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-slate-400 mb-2 text-sm">Select Vehicle</label>
                        <select
                            className="input-field w-full"
                            value={formData.vehicleId}
                            onChange={e => setFormData({ ...formData, vehicleId: e.target.value })}
                            disabled={!formData.customerId}
                            required
                        >
                            <option value="">-- Choose Vehicle --</option>
                            {availableVehicles.map(v => (
                                <option key={v.id} value={v.id}>{v.modelName} - {v.vehicleNumber}</option>
                            ))}
                        </select>
                        {formData.customerId && availableVehicles.length === 0 && (
                            <p className="text-xs text-yellow-500 mt-2">No vehicles found for this customer.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Service Details */}
            <div className="glass-panel p-6 space-y-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-emerald-400">🔧</span> Service Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-slate-400 mb-2 text-sm">Service Date</label>
                        <input
                            type="date"
                            className="input-field w-full"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 mb-2 text-sm">Service Type</label>
                        <select
                            className="input-field w-full"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option>General Service</option>
                            <option>Oil Change</option>
                            <option>Brake Repair</option>
                            <option>Engine Tuning</option>
                            <option>Major Repair</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-slate-400 mb-2 text-sm">Assigned Mechanic</label>
                        <input
                            type="text"
                            className="input-field w-full"
                            placeholder="Mechanic Name"
                            value={formData.mechanic}
                            onChange={e => setFormData({ ...formData, mechanic: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 mb-2 text-sm">Service Charge (Labor)</label>
                        <input
                            type="number"
                            className="input-field w-full"
                            min="0"
                            value={formData.serviceCharge}
                            onChange={e => setFormData({ ...formData, serviceCharge: parseFloat(e.target.value) })}
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-slate-400 mb-2 text-sm">Notes / Issues Reported</label>
                    <textarea
                        className="input-field w-full h-24"
                        placeholder="Describe issues or work performed..."
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>
            </div>

            {/* Spare Parts (Inventory Integration) */}
            <div className="glass-panel p-6 space-y-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-purple-400">📦</span> Spare Parts Used
                    </h3>
                    <button type="button" onClick={handleAddPart} className="btn btn-secondary text-xs">
                        + Add Part
                    </button>
                </div>

                {selectedParts.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 border border-dashed border-slate-700 rounded-lg">
                        No parts added yet. Click "+ Add Part" to select inventory items.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {selectedParts.map((part, index) => (
                            <div key={index} className="flex gap-4 items-end bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                                <div className="flex-1">
                                    <label className="text-xs text-slate-400 mb-1 block">Product</label>
                                    <select
                                        className="input-field w-full text-sm py-1.5"
                                        value={part.productId}
                                        onChange={e => handlePartChange(index, 'productId', e.target.value)}
                                        required
                                    >
                                        <option value="">Select Part...</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                                                {p.name} (Stock: {p.quantity}) - ₹{p.price}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-24">
                                    <label className="text-xs text-slate-400 mb-1 block">Qty</label>
                                    <input
                                        type="number"
                                        className="input-field w-full text-sm py-1.5"
                                        min="1"
                                        value={part.quantity}
                                        onChange={e => handlePartChange(index, 'quantity', e.target.value)}
                                        required
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemovePart(index)}
                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Job Card Financial Summary */}
            <div className="glass-panel p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-indigo-500/20">
                <h3 className="text-xl font-bold text-white mb-6">📝 Job Card Summary</h3>

                <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-slate-400">
                        <span>Total Parts Cost</span>
                        <span>₹{financials.partsCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                        <span>Service Charge (Labor)</span>
                        <span>₹{financials.serviceCharge.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 border-b border-slate-700 pb-3">
                        <span>Total GST (18%)</span>
                        <span>₹{financials.totalGst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-white pt-2">
                        <span>Grand Total</span>
                        <span className="text-emerald-400">₹{financials.totalCost.toFixed(2)}</span>
                    </div>
                </div>

                <div className="mt-8 flex gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="btn btn-secondary flex-1"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary flex-1 shadow-lg shadow-emerald-500/20"
                    >
                        {loading ? 'Processing...' : 'Create Job Card & Save Service'}
                    </button>
                </div>
            </div>
        </form>
    );
}
