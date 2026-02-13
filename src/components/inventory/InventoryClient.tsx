'use client';

import { useState } from 'react';
import { Product } from '@/types';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/ui/CustomSelect';
import { useRouter } from 'next/navigation';

export default function InventoryClient({ initialProducts }: { initialProducts: Product[] }) {
    const router = useRouter();
    const [products, setProducts] = useState(initialProducts);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState<'All' | 'Tool' | 'Spare Part'>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    // Form state for custom selects
    const [formCategory, setFormCategory] = useState("Tool");
    const [formGstRate, setFormGstRate] = useState("18");

    // Filter products based on category and search
    const filteredProducts = products.filter(p => {
        const matchesCategory = filter === 'All' || p.category === filter;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.supplier.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    async function handleAddProduct(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        // Call server action via API or direct
        // Since I'm in client component, I need to define the server action as an imported function
        // But for simplicity in this demo, let's assume I created `saveProduct` action separately and import it.
        // Wait, I can't define server action inside client comp. I must import.
        // I defined `addProduct` in `src/app/actions.ts`.

        try {
            const { addProduct } = await import('@/app/actions');
            await addProduct(formData);
            setIsModalOpen(false);
            router.refresh(); // Fetch new data
            // Optimistic update?
            // const newProduct = { ...formDataObject ... };
            // setProducts([...products, newProduct]); 
        } catch (error) {
            console.error(error);
            alert('Failed to add product');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="bg-slate-800 border-slate-700 text-white rounded-lg px-4 py-2 w-full sm:w-64 focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <CustomSelect
                        className="w-full sm:w-auto min-w-[200px]"
                        value={filter}
                        onChange={(val) => setFilter(val as any)}
                        options={[
                            { value: "All", label: "All Categories" },
                            { value: "Tool", label: "Tools" },
                            { value: "Spare Part", label: "Spare Parts" }
                        ]}
                        icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                        }
                    />
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg shadow-lg flex justify-center items-center gap-2 transition-transform active:scale-95"
                >
                    <span>+</span> Add Product
                </button>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-slate-900/50 text-slate-400 text-sm uppercase tracking-wider">
                            <th className="p-4 font-medium border-b border-slate-700">Name</th>
                            <th className="p-4 font-medium border-b border-slate-700">Category</th>
                            <th className="p-4 font-medium border-b border-slate-700">Supplier</th>
                            <th className="p-4 font-medium border-b border-slate-700 text-right">Price (₹)</th>
                            <th className="p-4 font-medium border-b border-slate-700 text-right">Stock</th>
                            <th className="p-4 font-medium border-b border-slate-700 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {filteredProducts.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-slate-500">No products found.</td></tr>
                        ) : (
                            filteredProducts.map(product => (
                                <tr key={product.id} className="hover:bg-slate-700/30 transition-colors group">
                                    <td className="p-4 font-medium text-white">{product.name}</td>
                                    <td className="p-4 text-slate-300">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold border ${product.category === 'Tool'
                                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                            : 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                                            }`}>
                                            {product.category}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-400">{product.supplier}</td>
                                    <td className="p-4 text-right font-mono text-slate-300">
                                        ₹{product.sellingPrice.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-right font-bold text-white">
                                        {product.quantity}
                                    </td>
                                    <td className="p-4 text-center">
                                        {product.quantity <= product.minStockAlert ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-500/30 animate-pulse">
                                                Low Stock
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-500/30">
                                                In Stock
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Product">
                <form onSubmit={handleAddProduct} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Product Name</label>
                        <input name="name" required type="text" className="w-full bg-slate-900 border-slate-700 rounded-lg p-2.5 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Wrench Set" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                            <CustomSelect
                                name="category"
                                value={formCategory}
                                onChange={setFormCategory}
                                options={[
                                    { value: "Tool", label: "Tool" },
                                    { value: "Spare Part", label: "Spare Part" }
                                ]}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Supplier</label>
                            <input name="supplier" required type="text" className="w-full bg-slate-900 border-slate-700 rounded-lg p-2.5 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="Supplier Name" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Purchase Price</label>
                            <input name="purchasePrice" required type="number" step="0.01" className="w-full bg-slate-900 border-slate-700 rounded-lg p-2.5 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="0.00" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Selling Price</label>
                            <input name="sellingPrice" required type="number" step="0.01" className="w-full bg-slate-900 border-slate-700 rounded-lg p-2.5 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="0.00" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">GST Rate (%)</label>
                            <CustomSelect
                                name="gstRate"
                                value={formGstRate}
                                onChange={setFormGstRate}
                                options={[
                                    { value: "18", label: "18%" },
                                    { value: "12", label: "12%" },
                                    { value: "5", label: "5%" },
                                    { value: "28", label: "28%" }
                                ]}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Initial Quantity</label>
                            <input name="quantity" required type="number" className="w-full bg-slate-900 border-slate-700 rounded-lg p-2.5 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="0" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Min Stock Alert</label>
                            <input name="minStockAlert" required type="number" className="w-full bg-slate-900 border-slate-700 rounded-lg p-2.5 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="5" />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button disabled={loading} type="submit" className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? 'Saving...' : 'Save Product'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
