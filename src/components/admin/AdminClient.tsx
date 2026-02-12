'use client';

import { useState, useMemo } from 'react';
import { Product, Customer } from '@/types';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/ui/CustomSelect';
import { MECHANICS_DATA, Mechanic } from '@/lib/constants';

export default function AdminClient({ products, customers }: { products: Product[], customers: Customer[] }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'products' | 'customers' | 'employees'>('products');
    const [searchTerm, setSearchTerm] = useState('');

    // Product edit state
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editForm, setEditForm] = useState<Partial<Product>>({});

    // Customer edit state
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [custEditForm, setCustEditForm] = useState<{ name: string; phone: string; email: string }>({ name: '', phone: '', email: '' });

    // Employee detail modal
    const [viewingEmployee, setViewingEmployee] = useState<Mechanic | null>(null);

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'product' | 'customer'; id: string; name: string } | null>(null);

    const [saving, setSaving] = useState(false);

    // ---- Compute mechanic stats from service history ----
    const mechanicStats = useMemo(() => {
        const stats: Record<string, { jobsDone: number; totalRevenue: number; lastServiceDate: string }> = {};

        // Initialize all mechanics
        MECHANICS_DATA.forEach(m => {
            stats[m.name] = { jobsDone: 0, totalRevenue: 0, lastServiceDate: '' };
        });

        // Aggregate from all vehicles' service history
        customers.forEach(c => {
            c.vehicles.forEach(v => {
                v.serviceHistory.forEach(s => {
                    const mechName = s.mechanic || '';
                    if (stats[mechName]) {
                        stats[mechName].jobsDone += 1;
                        stats[mechName].totalRevenue += s.totalCost;
                        if (!stats[mechName].lastServiceDate || s.date > stats[mechName].lastServiceDate) {
                            stats[mechName].lastServiceDate = s.date;
                        }
                    }
                });
            });
        });

        return stats;
    }, [customers]);

    // Filter
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const filteredEmployees = MECHANICS_DATA.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phone.includes(searchTerm) ||
        m.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    function openProductEdit(product: Product) {
        setEditingProduct(product);
        setEditForm({ ...product });
    }

    function openCustomerEdit(customer: Customer) {
        setEditingCustomer(customer);
        setCustEditForm({ name: customer.name, phone: customer.phone, email: customer.email || '' });
    }

    async function handleProductSave() {
        if (!editingProduct || !editForm) return;
        setSaving(true);
        try {
            const { updateProduct } = await import('@/app/actions');
            await updateProduct(editingProduct.id, {
                name: editForm.name,
                category: editForm.category as any,
                supplier: editForm.supplier,
                price: Number(editForm.price),
                gstRate: Number(editForm.gstRate),
                quantity: Number(editForm.quantity),
                minStockAlert: Number(editForm.minStockAlert),
            });
            setEditingProduct(null);
            router.refresh();
        } catch (err: any) {
            alert(err.message || 'Failed to update product');
        } finally {
            setSaving(false);
        }
    }

    async function handleCustomerSave() {
        if (!editingCustomer) return;
        setSaving(true);
        try {
            const { updateCustomer } = await import('@/app/actions');
            const fd = new FormData();
            fd.set('id', editingCustomer.id);
            fd.set('name', custEditForm.name);
            fd.set('phone', custEditForm.phone);
            fd.set('email', custEditForm.email);
            await updateCustomer(fd);
            setEditingCustomer(null);
            router.refresh();
        } catch (err: any) {
            alert(err.message || 'Failed to update customer');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!deleteConfirm) return;
        setSaving(true);
        try {
            if (deleteConfirm.type === 'product') {
                const { deleteProduct } = await import('@/app/actions');
                await deleteProduct(deleteConfirm.id);
            } else {
                const { deleteCustomer } = await import('@/app/actions');
                await deleteCustomer(deleteConfirm.id);
            }
            setDeleteConfirm(null);
            router.refresh();
        } catch (err: any) {
            alert(err.message || 'Failed to delete');
        } finally {
            setSaving(false);
        }
    }

    // Helper — role badge color
    function getRoleBadge(role: Mechanic['role']) {
        switch (role) {
            case 'Senior Mechanic': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            case 'Junior Mechanic': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
            case 'Specialist': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
            case 'Trainee': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            default: return 'bg-slate-700 text-slate-300 border-slate-600';
        }
    }

    function getStatusBadge(status: Mechanic['status']) {
        switch (status) {
            case 'Active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'On Leave': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'Inactive': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-slate-700 text-slate-300 border-slate-600';
        }
    }

    function formatDate(dateStr: string) {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch { return dateStr; }
    }

    // Summary stats for employees
    const empSummary = useMemo(() => {
        const active = MECHANICS_DATA.filter(m => m.status === 'Active').length;
        const onLeave = MECHANICS_DATA.filter(m => m.status === 'On Leave').length;
        const totalJobs = Object.values(mechanicStats).reduce((s, v) => s + v.jobsDone, 0);
        const totalRev = Object.values(mechanicStats).reduce((s, v) => s + v.totalRevenue, 0);
        return { active, onLeave, totalJobs, totalRev };
    }, [mechanicStats]);

    return (
        <div>
            {/* Tab Switcher + Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => { setActiveTab('products'); setSearchTerm(''); }}
                        className={`px-5 py-2.5 rounded-lg font-medium transition-all text-sm ${activeTab === 'products'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                            }`}
                    >
                        🔧 Products ({products.length})
                    </button>
                    <button
                        onClick={() => { setActiveTab('customers'); setSearchTerm(''); }}
                        className={`px-5 py-2.5 rounded-lg font-medium transition-all text-sm ${activeTab === 'customers'
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                            }`}
                    >
                        👥 Customers ({customers.length})
                    </button>
                    <button
                        onClick={() => { setActiveTab('employees'); setSearchTerm(''); }}
                        className={`px-5 py-2.5 rounded-lg font-medium transition-all text-sm ${activeTab === 'employees'
                            ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                            }`}
                    >
                        🛠️ Employees ({MECHANICS_DATA.length})
                    </button>
                </div>
                <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    className="bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 w-full md:w-72 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Products Tab */}
            {activeTab === 'products' && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="p-4 border-b border-slate-700">Product</th>
                                <th className="p-4 border-b border-slate-700">Category</th>
                                <th className="p-4 border-b border-slate-700">Supplier</th>
                                <th className="p-4 border-b border-slate-700 text-right">Price (₹)</th>
                                <th className="p-4 border-b border-slate-700 text-right">GST %</th>
                                <th className="p-4 border-b border-slate-700 text-right">Stock</th>
                                <th className="p-4 border-b border-slate-700 text-right">Min Alert</th>
                                <th className="p-4 border-b border-slate-700 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {filteredProducts.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-8 text-slate-500">No products found.</td></tr>
                            ) : (
                                filteredProducts.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-700/30 transition-colors group">
                                        <td className="p-4">
                                            <span className="font-medium text-white">{p.name}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.category === 'Tool'
                                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                                }`}>
                                                {p.category}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-300 text-sm">{p.supplier}</td>
                                        <td className="p-4 text-right font-mono text-emerald-400 font-bold">₹{p.price.toLocaleString()}</td>
                                        <td className="p-4 text-right text-slate-300">{p.gstRate}%</td>
                                        <td className="p-4 text-right">
                                            <span className={`font-bold ${p.quantity <= p.minStockAlert ? 'text-red-400' : 'text-white'}`}>
                                                {p.quantity}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right text-slate-400">{p.minStockAlert}</td>
                                        <td className="p-4 text-center space-x-2">
                                            <button
                                                onClick={() => openProductEdit(p)}
                                                className="text-blue-400 hover:text-blue-300 text-sm font-medium hover:underline"
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm({ type: 'product', id: p.id, name: p.name })}
                                                className="text-red-400 hover:text-red-300 text-sm font-medium hover:underline"
                                            >
                                                🗑 Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Customers Tab */}
            {activeTab === 'customers' && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                        <thead>
                            <tr className="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="p-4 border-b border-slate-700">Customer</th>
                                <th className="p-4 border-b border-slate-700">Phone</th>
                                <th className="p-4 border-b border-slate-700">Email</th>
                                <th className="p-4 border-b border-slate-700 text-center">Vehicles</th>
                                <th className="p-4 border-b border-slate-700 text-center">Total Services</th>
                                <th className="p-4 border-b border-slate-700 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {filteredCustomers.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-8 text-slate-500">No customers found.</td></tr>
                            ) : (
                                filteredCustomers.map(c => {
                                    const totalServices = c.vehicles.reduce((sum, v) => sum + v.serviceHistory.length, 0);
                                    return (
                                        <tr key={c.id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="p-4">
                                                <span className="font-medium text-white">{c.name}</span>
                                            </td>
                                            <td className="p-4 text-slate-300">{c.phone}</td>
                                            <td className="p-4 text-slate-400 text-sm">{c.email || '—'}</td>
                                            <td className="p-4 text-center">
                                                <div className="flex flex-wrap gap-1 justify-center">
                                                    {c.vehicles.map(v => (
                                                        <span key={v.id} className="text-xs bg-slate-700 text-slate-200 px-2 py-0.5 rounded">
                                                            {v.vehicleNumber}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="bg-blue-900/40 text-blue-300 py-1 px-3 rounded-full text-xs font-bold">
                                                    {totalServices}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center space-x-2">
                                                <button
                                                    onClick={() => openCustomerEdit(c)}
                                                    className="text-blue-400 hover:text-blue-300 text-sm font-medium hover:underline"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm({ type: 'customer', id: c.id, name: c.name })}
                                                    className="text-red-400 hover:text-red-300 text-sm font-medium hover:underline"
                                                >
                                                    🗑 Delete
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ========== EMPLOYEES TAB ========== */}
            {activeTab === 'employees' && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="glass-panel p-4 text-center">
                            <p className="text-3xl font-bold text-white">{MECHANICS_DATA.length}</p>
                            <p className="text-slate-400 text-xs mt-1">Total Staff</p>
                        </div>
                        <div className="glass-panel p-4 text-center">
                            <p className="text-3xl font-bold text-emerald-400">{empSummary.active}</p>
                            <p className="text-slate-400 text-xs mt-1">Active</p>
                        </div>
                        <div className="glass-panel p-4 text-center">
                            <p className="text-3xl font-bold text-yellow-400">{empSummary.onLeave}</p>
                            <p className="text-slate-400 text-xs mt-1">On Leave</p>
                        </div>
                        <div className="glass-panel p-4 text-center">
                            <p className="text-3xl font-bold text-blue-400">{empSummary.totalJobs}</p>
                            <p className="text-slate-400 text-xs mt-1">Jobs Completed</p>
                        </div>
                    </div>

                    {/* Employees Table */}
                    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl overflow-x-auto">
                        <table className="w-full text-left min-w-[900px]">
                            <thead>
                                <tr className="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="p-4 border-b border-slate-700">Employee</th>
                                    <th className="p-4 border-b border-slate-700">Phone</th>
                                    <th className="p-4 border-b border-slate-700">Role</th>
                                    <th className="p-4 border-b border-slate-700">Specialization</th>
                                    <th className="p-4 border-b border-slate-700 text-center">Status</th>
                                    <th className="p-4 border-b border-slate-700 text-right">Jobs Done</th>
                                    <th className="p-4 border-b border-slate-700 text-right">Revenue (₹)</th>
                                    <th className="p-4 border-b border-slate-700 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {filteredEmployees.length === 0 ? (
                                    <tr><td colSpan={8} className="text-center py-8 text-slate-500">No employees found.</td></tr>
                                ) : (
                                    filteredEmployees.map(m => {
                                        const stats = mechanicStats[m.name] || { jobsDone: 0, totalRevenue: 0, lastServiceDate: '' };
                                        return (
                                            <tr key={m.id} className="hover:bg-slate-700/30 transition-colors">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                            {m.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-white">{m.name}</p>
                                                            <p className="text-slate-500 text-xs">Since {formatDate(m.joinDate)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-slate-300 text-sm font-mono">{m.phone}</td>
                                                <td className="p-4">
                                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${getRoleBadge(m.role)}`}>
                                                        {m.role}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-slate-300 text-sm">{m.specialization}</td>
                                                <td className="p-4 text-center">
                                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${getStatusBadge(m.status)}`}>
                                                        {m.status === 'Active' ? '● ' : m.status === 'On Leave' ? '◐ ' : '○ '}{m.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="font-bold text-white">{stats.jobsDone}</span>
                                                </td>
                                                <td className="p-4 text-right font-mono text-emerald-400 font-bold">
                                                    ₹{stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => setViewingEmployee(m)}
                                                        className="text-blue-400 hover:text-blue-300 text-sm font-medium hover:underline"
                                                    >
                                                        👁 View
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ======= EDIT PRODUCT MODAL ======= */}
            <Modal isOpen={!!editingProduct} onClose={() => setEditingProduct(null)} title="Edit Product">
                {editingProduct && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Product Name</label>
                            <input
                                value={editForm.name || ''}
                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Category</label>
                                <CustomSelect
                                    value={editForm.category || 'Tool'}
                                    onChange={(val) => setEditForm({ ...editForm, category: val as any })}
                                    options={[
                                        { value: 'Tool', label: 'Tool' },
                                        { value: 'Spare Part', label: 'Spare Part' }
                                    ]}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Supplier</label>
                                <input
                                    value={editForm.supplier || ''}
                                    onChange={e => setEditForm({ ...editForm, supplier: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-white"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Price (₹)</label>
                                <input
                                    type="number"
                                    value={editForm.price || 0}
                                    onChange={e => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-white font-mono text-right"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">GST Rate (%)</label>
                                <input
                                    type="number"
                                    value={editForm.gstRate || 0}
                                    onChange={e => setEditForm({ ...editForm, gstRate: parseFloat(e.target.value) })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-white font-mono text-right"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Current Stock</label>
                                <input
                                    type="number"
                                    value={editForm.quantity || 0}
                                    onChange={e => setEditForm({ ...editForm, quantity: parseInt(e.target.value) })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-white font-mono text-right"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Min Stock Alert</label>
                                <input
                                    type="number"
                                    value={editForm.minStockAlert || 0}
                                    onChange={e => setEditForm({ ...editForm, minStockAlert: parseInt(e.target.value) })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-white font-mono text-right"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleProductSave}
                            disabled={saving}
                            className="w-full btn btn-primary mt-4 py-3"
                        >
                            {saving ? 'Saving...' : '💾 Save Changes'}
                        </button>
                    </div>
                )}
            </Modal>

            {/* ======= EDIT CUSTOMER MODAL ======= */}
            <Modal isOpen={!!editingCustomer} onClose={() => setEditingCustomer(null)} title="Edit Customer">
                {editingCustomer && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Customer Name</label>
                            <input
                                value={custEditForm.name}
                                onChange={e => setCustEditForm({ ...custEditForm, name: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Phone</label>
                            <input
                                value={custEditForm.phone}
                                onChange={e => setCustEditForm({ ...custEditForm, phone: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Email</label>
                            <input
                                value={custEditForm.email}
                                onChange={e => setCustEditForm({ ...custEditForm, email: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-white"
                            />
                        </div>

                        {/* Show vehicles (read-only info) */}
                        <div className="border-t border-slate-700 pt-4">
                            <label className="text-sm text-slate-300 font-medium mb-2 block">Linked Vehicles</label>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {editingCustomer.vehicles.map(v => (
                                    <div key={v.id} className="bg-slate-800 p-2.5 rounded text-sm flex justify-between items-center border border-slate-700/50">
                                        <div>
                                            <span className="text-white font-medium">{v.vehicleNumber}</span>
                                            <span className="text-slate-400 ml-2">— {v.modelName}</span>
                                        </div>
                                        <span className="text-xs text-slate-500">{v.serviceHistory.length} services</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleCustomerSave}
                            disabled={saving}
                            className="w-full btn btn-primary mt-4 py-3"
                        >
                            {saving ? 'Saving...' : '💾 Save Changes'}
                        </button>
                    </div>
                )}
            </Modal>

            {/* ======= VIEW EMPLOYEE DETAIL MODAL ======= */}
            <Modal isOpen={!!viewingEmployee} onClose={() => setViewingEmployee(null)} title="👤 Employee Details">
                {viewingEmployee && (() => {
                    const stats = mechanicStats[viewingEmployee.name] || { jobsDone: 0, totalRevenue: 0, lastServiceDate: '' };
                    return (
                        <div className="space-y-5">
                            {/* Header */}
                            <div className="flex items-center gap-4 bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-lg">
                                    {viewingEmployee.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xl font-bold text-white">{viewingEmployee.name}</h4>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getRoleBadge(viewingEmployee.role)}`}>
                                            {viewingEmployee.role}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getStatusBadge(viewingEmployee.status)}`}>
                                            {viewingEmployee.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
                                    <p className="text-slate-500 text-xs uppercase tracking-wide">Phone</p>
                                    <p className="text-white font-mono mt-1">{viewingEmployee.phone}</p>
                                </div>
                                <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
                                    <p className="text-slate-500 text-xs uppercase tracking-wide">Specialization</p>
                                    <p className="text-white mt-1">{viewingEmployee.specialization}</p>
                                </div>
                                <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
                                    <p className="text-slate-500 text-xs uppercase tracking-wide">Join Date</p>
                                    <p className="text-white mt-1">{formatDate(viewingEmployee.joinDate)}</p>
                                </div>
                                <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
                                    <p className="text-slate-500 text-xs uppercase tracking-wide">Daily Wage</p>
                                    <p className="text-emerald-400 mt-1 font-bold">₹{viewingEmployee.dailyWage}</p>
                                </div>
                            </div>

                            {/* Performance Stats */}
                            <div className="border-t border-slate-700 pt-4">
                                <h5 className="text-sm font-medium text-slate-300 mb-3">📊 Performance</h5>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="text-center bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                        <p className="text-2xl font-bold text-blue-400">{stats.jobsDone}</p>
                                        <p className="text-slate-400 text-xs mt-1">Jobs Done</p>
                                    </div>
                                    <div className="text-center bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                                        <p className="text-2xl font-bold text-emerald-400">₹{stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                                        <p className="text-slate-400 text-xs mt-1">Revenue</p>
                                    </div>
                                    <div className="text-center bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                                        <p className="text-sm font-bold text-purple-400">{stats.lastServiceDate ? formatDate(stats.lastServiceDate) : '—'}</p>
                                        <p className="text-slate-400 text-xs mt-1">Last Service</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </Modal>

            {/* ======= DELETE CONFIRMATION MODAL ======= */}
            <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="⚠️ Confirm Delete">
                {deleteConfirm && (
                    <div className="space-y-6">
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                            <p className="text-red-400 font-medium text-center">
                                Are you sure you want to permanently delete?
                            </p>
                            <p className="text-white font-bold text-center text-lg mt-2">
                                &quot;{deleteConfirm.name}&quot;
                            </p>
                            <p className="text-slate-400 text-center text-sm mt-1">
                                ({deleteConfirm.type === 'product' ? 'Product' : 'Customer & all vehicles/history'})
                            </p>
                        </div>
                        <p className="text-slate-500 text-xs text-center">This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={saving}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-medium transition-colors"
                            >
                                {saving ? 'Deleting...' : '🗑 Delete'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
