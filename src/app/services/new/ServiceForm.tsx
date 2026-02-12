'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Customer, Product } from '@/types';
import { saveService, addVehicle } from '@/app/actions';
import { useRouter } from 'next/navigation';
import CustomSelect from '@/components/ui/CustomSelect';

interface ServiceFormProps {
    customers: Customer[];
    products: Product[];
    mechanics: string[];
}

export default function ServiceForm({ customers, products, mechanics }: ServiceFormProps) {
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

    // Customer search state
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const customerSearchRef = useRef<HTMLDivElement>(null);

    // Add vehicle inline state
    const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);
    const [addingVehicle, setAddingVehicle] = useState(false);
    const [newVehicleType, setNewVehicleType] = useState('Car - Sedan'); // State for inline form custom select

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
        setFormData({ ...formData, customerId: customer.id, vehicleId: '' });
        setCustomerSearch(`${customer.name} (${customer.phone})`);
        setShowCustomerDropdown(false);
        setShowAddVehicleForm(false);
    };

    const handleClearCustomer = () => {
        setFormData({ ...formData, customerId: '', vehicleId: '' });
        setCustomerSearch('');
        setShowAddVehicleForm(false);
    };

    const handleAddVehicleInline = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setAddingVehicle(true);
        try {
            const form = e.currentTarget;
            const fd = new FormData(form);
            await addVehicle(fd);
            setShowAddVehicleForm(false);
            // Refresh the page to get updated customer data with the new vehicle
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Failed to add vehicle.');
        } finally {
            setAddingVehicle(false);
        }
    };

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

    // Options for CustomSelects
    const vehicleOptions = useMemo(() => availableVehicles.map(v => ({
        value: v.id,
        label: `${v.modelName} - ${v.vehicleNumber}`
    })), [availableVehicles]);

    const mechanicOptions = useMemo(() => mechanics.map(m => ({
        value: m,
        label: m
    })), [mechanics]);

    const productOptions = useMemo(() => products.map(p => ({
        value: p.id,
        label: `${p.name} (Stock: ${p.quantity}) - ₹${p.price}`
    })), [products]);

    const serviceTypeOptions = [
        { value: 'General Service', label: 'General Service' },
        { value: 'Oil Change', label: 'Oil Change' },
        { value: 'Brake Repair', label: 'Brake Repair' },
        { value: 'Engine Tuning', label: 'Engine Tuning' },
        { value: 'Major Repair', label: 'Major Repair' },
        { value: 'Other', label: 'Other' }
    ];

    const vehicleTypeOptions = [
        { value: 'Car - Sedan', label: 'Car - Sedan' },
        { value: 'Car - SUV', label: 'Car - SUV' },
        { value: 'Car - Hatchback', label: 'Car - Hatchback' },
        { value: 'Bike - Sport', label: 'Bike - Sport' },
        { value: 'Bike - Commuter', label: 'Bike - Commuter' },
        { value: 'Scooter', label: 'Scooter' },
        { value: 'Other', label: 'Other' }
    ];

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
            <div className="glass-panel p-6 space-y-6 !overflow-visible relative z-20">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-blue-400">👤</span> Customer & Vehicle
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Searchable Customer Input */}
                    <div ref={customerSearchRef} className="relative">
                        <label className="block text-slate-400 mb-2 text-sm">Search Customer</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                className="input-field w-full pl-10 pr-10"
                                placeholder="Type name, phone, or email..."
                                value={customerSearch}
                                onChange={e => {
                                    setCustomerSearch(e.target.value);
                                    setShowCustomerDropdown(true);
                                    if (!e.target.value.trim()) {
                                        handleClearCustomer();
                                    }
                                }}
                                onFocus={() => setShowCustomerDropdown(true)}
                            />
                            {formData.customerId && (
                                <button
                                    type="button"
                                    onClick={handleClearCustomer}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-red-400 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Customer Search Dropdown */}
                        {showCustomerDropdown && !formData.customerId && (
                            <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
                                {filteredCustomers.length === 0 ? (
                                    <div className="p-4 text-center text-slate-500 text-sm">
                                        No customers found matching &quot;{customerSearch}&quot;
                                    </div>
                                ) : (
                                    filteredCustomers.map(c => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => handleSelectCustomer(c)}
                                            className="w-full text-left px-4 py-3 hover:bg-slate-700/70 transition-colors border-b border-slate-700/50 last:border-b-0 flex items-center gap-3"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                {c.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-sm font-medium truncate">{c.name}</p>
                                                <p className="text-slate-400 text-xs truncate">
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
                            <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-md">
                                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">✓</div>
                                <span className="text-emerald-400 text-xs font-medium">{selectedCustomer.name} selected · {availableVehicles.length} vehicle{availableVehicles.length !== 1 ? 's' : ''}</span>
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-slate-400 text-sm">Select Vehicle</label>
                            {formData.customerId && (
                                <button
                                    type="button"
                                    onClick={() => setShowAddVehicleForm(!showAddVehicleForm)}
                                    className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                                >
                                    {showAddVehicleForm ? '✕ Cancel' : '+ New Vehicle'}
                                </button>
                            )}
                        </div>
                        <CustomSelect
                            className="w-full"
                            value={formData.vehicleId}
                            onChange={(val) => setFormData({ ...formData, vehicleId: val })}
                            options={vehicleOptions}
                            placeholder="-- Choose Vehicle --"
                        />
                        {formData.customerId && availableVehicles.length === 0 && !showAddVehicleForm && (
                            <p className="text-xs text-yellow-500 mt-2">No vehicles found. Click &quot;+ New Vehicle&quot; to add one.</p>
                        )}
                    </div>
                </div>

                {/* Inline Add Vehicle Form */}
                {showAddVehicleForm && formData.customerId && (
                    <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl animate-fade-in">
                        <h4 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                            <span>🚗</span> Add New Vehicle for {selectedCustomer?.name}
                        </h4>
                        <form onSubmit={handleAddVehicleInline} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input type="hidden" name="customerId" value={formData.customerId} />
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Vehicle No.</label>
                                <input
                                    name="vehicleNumber"
                                    required
                                    placeholder="KA-01-XX-1234"
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Model Name</label>
                                <input
                                    name="modelName"
                                    required
                                    placeholder="e.g. Swift Dzire"
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Vehicle Type</label>
                                <CustomSelect
                                    name="vehicleType"
                                    value={newVehicleType}
                                    onChange={setNewVehicleType}
                                    options={vehicleTypeOptions}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <button
                                    type="submit"
                                    disabled={addingVehicle}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    {addingVehicle ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                            Adding...
                                        </>
                                    ) : (
                                        '✓ Add Vehicle & Continue'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
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
                        <CustomSelect
                            className="w-full"
                            value={formData.type}
                            onChange={(val) => setFormData({ ...formData, type: val })}
                            options={serviceTypeOptions}
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 mb-2 text-sm">Assigned Mechanic</label>
                        <CustomSelect
                            className="w-full"
                            value={formData.mechanic}
                            onChange={(val) => setFormData({ ...formData, mechanic: val })}
                            options={mechanicOptions}
                            placeholder="-- Select Mechanic --"
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
                        No parts added yet. Click &quot;+ Add Part&quot; to select inventory items.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {selectedParts.map((part, index) => (
                            <div key={index} className="flex gap-4 items-end bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                                <div className="flex-1">
                                    <label className="text-xs text-slate-400 mb-1 block">Product</label>
                                    <CustomSelect
                                        className="w-full"
                                        value={part.productId}
                                        onChange={(val) => handlePartChange(index, 'productId', val)}
                                        options={productOptions.filter(p => !p.label.includes('Stock: 0') || p.value === part.productId)} // Basic filtering to hide OOS? Actually CustomSelect doesn't support disabling options easily yet.
                                    // Wait, CustomSelect options don't support 'disabled' yet.
                                    // But I can just pass all options.
                                    // Or filter them.
                                    />
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
