'use client';

import { useState, useEffect } from 'react';
import { Customer, Vehicle } from '@/types';
import Modal from '@/components/ui/Modal';
import { useRouter } from 'next/navigation';

export default function CustomerClient({ initialCustomers }: { initialCustomers: Customer[] }) {
    const router = useRouter();
    const [customers, setCustomers] = useState(initialCustomers);

    // Sync state with props on router.refresh()
    useEffect(() => {
        setCustomers(initialCustomers);
    }, [initialCustomers]);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedVehicleData, setSelectedVehicleData] = useState<{ customer: Customer, vehicle: Vehicle } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Flatten customers to vehicle rows for display
    const vehicleRows = customers.flatMap(c =>
        c.vehicles.map(v => ({ customer: c, vehicle: v }))
    );

    const filteredRows = vehicleRows.filter(({ customer, vehicle }) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
    );

    async function handleAddCustomer(formData: FormData) {
        const { addCustomer } = await import('@/app/actions');
        await addCustomer(formData);
        setIsAddModalOpen(false);
        router.refresh();
    }

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

    async function handleUpdateCustomer(formData: FormData) {
        const { updateCustomer } = await import('@/app/actions');
        await updateCustomer(formData);
        setIsEditModalOpen(false);
        setCustomerToEdit(null);
        router.refresh();
    }

    function openEditModal(customer: Customer) {
        setCustomerToEdit(customer);
        setIsEditModalOpen(true);
    }

    const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
    const [customerForVehicle, setCustomerForVehicle] = useState<Customer | null>(null);

    async function handleAddVehicle(formData: FormData) {
        const { addVehicle } = await import('@/app/actions');
        await addVehicle(formData);
        setIsAddVehicleModalOpen(false);
        setCustomerForVehicle(null);
        router.refresh();
    }

    function openAddVehicleModal(customer: Customer) {
        setCustomerForVehicle(customer);
        setIsAddVehicleModalOpen(true);
        setIsEditModalOpen(false); // Close edit modal if open
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Search by Name, Vehicle or Phone..."
                    className="bg-slate-800 border-slate-700 text-white rounded-lg px-4 py-2 w-full md:w-80 focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded-lg shadow-lg flex justify-center items-center gap-2 transition-transform active:scale-95"
                >
                    <span>+</span> New Customer
                </button>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                    <thead>
                        <tr className="bg-slate-900/50 text-slate-400 text-sm uppercase tracking-wider">
                            <th className="p-4 border-b border-slate-700">Vehicle Info</th>
                            <th className="p-4 border-b border-slate-700">Customer</th>
                            <th className="p-4 border-b border-slate-700">Last Service</th>
                            <th className="p-4 border-b border-slate-700">Next Due</th>
                            <th className="p-4 border-b border-slate-700 text-center">History</th>
                            <th className="p-4 border-b border-slate-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {filteredRows.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-slate-500">No vehicles found.</td></tr>
                        ) : (
                            filteredRows.map(({ customer, vehicle }) => {
                                const lastService = vehicle.serviceHistory.length > 0
                                    ? vehicle.serviceHistory[vehicle.serviceHistory.length - 1]
                                    : null;

                                let dueStatus = { days: 0, color: 'text-slate-400', label: 'N/A', isCritical: false };

                                if (lastService) {
                                    const lastDate = new Date(lastService.date);
                                    const nextDate = new Date(lastDate);
                                    nextDate.setDate(lastDate.getDate() + 150);

                                    const now = new Date();
                                    const diffTime = nextDate.getTime() - now.getTime();
                                    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                    if (daysLeft <= 0) {
                                        dueStatus = {
                                            days: Math.abs(daysLeft),
                                            color: 'text-red-500 font-bold',
                                            label: 'Overdue',
                                            isCritical: true
                                        };
                                    } else if (daysLeft <= 15) {
                                        dueStatus = {
                                            days: daysLeft,
                                            color: 'text-yellow-400',
                                            label: `${daysLeft} Days Left`,
                                            isCritical: false
                                        };
                                    } else {
                                        dueStatus = {
                                            days: daysLeft,
                                            color: 'text-emerald-400',
                                            label: `${daysLeft} Days Left`,
                                            isCritical: false
                                        };
                                    }
                                } else {
                                    // No history, maybe check registration?
                                    dueStatus = { days: 0, color: 'text-blue-400', label: 'New / Ready', isCritical: false };
                                }

                                return (
                                    <tr key={vehicle.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-white bg-slate-700 px-2 py-1 rounded inline-block mb-1">
                                                {vehicle.vehicleNumber}
                                            </div>
                                            <div className="text-sm text-slate-300">{vehicle.modelName}</div>
                                            <div className="text-xs text-slate-500">{vehicle.vehicleType}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-white">{customer.name}</div>
                                            <div className="text-sm text-slate-400">{customer.phone}</div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-300">
                                            {lastService ? (
                                                <>
                                                    <div className="text-white">{new Date(lastService.date).toLocaleDateString()}</div>
                                                    <div className="text-slate-500 text-xs">{lastService.type}</div>
                                                </>
                                            ) : (
                                                <span className="text-slate-500 italic">No history</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm">
                                            <div className="flex flex-col items-start gap-1">
                                                <span className={dueStatus.color}>{dueStatus.label}</span>
                                                {dueStatus.isCritical && (
                                                    <a
                                                        href={`https://wa.me/91${customer.phone}?text=Hello ${customer.name}, your vehicle ${vehicle.vehicleNumber} is due for service. Please visit us.`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-white bg-green-600 px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-green-500"
                                                    >
                                                        <span>💬</span> Alert
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="bg-blue-900/40 text-blue-300 py-1 px-3 rounded-full text-xs font-bold">
                                                {vehicle.serviceHistory.length}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            <button
                                                onClick={() => openEditModal(customer)}
                                                className="text-slate-400 hover:text-white text-sm font-medium hover:underline"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setSelectedVehicleData({ customer, vehicle })}
                                                className="text-blue-400 hover:text-blue-300 text-sm font-medium hover:underline"
                                            >
                                                History
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* View History Modal */}
            <Modal isOpen={!!selectedVehicleData} onClose={() => setSelectedVehicleData(null)} title="Service History">
                {selectedVehicleData && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-start bg-slate-900/50 p-4 rounded-lg">
                            <div>
                                <h4 className="text-lg font-bold text-white">{selectedVehicleData.vehicle.vehicleNumber}</h4>
                                <p className="text-slate-400">{selectedVehicleData.vehicle.modelName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-white font-medium">{selectedVehicleData.customer.name}</p>
                                <p className="text-emerald-400 text-sm">{selectedVehicleData.customer.phone}</p>
                            </div>
                        </div>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            <h5 className="text-sm uppercase tracking-wider text-slate-500 font-bold border-b border-slate-700 pb-2">Completed Services</h5>
                            {selectedVehicleData.vehicle.serviceHistory.length === 0 ? (
                                <p className="text-slate-500 italic">No service records found.</p>
                            ) : (
                                [...selectedVehicleData.vehicle.serviceHistory].reverse().map((service, idx) => (
                                    <div key={idx} className="bg-slate-700/30 p-4 rounded-lg border border-slate-700/50">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-white font-bold">{service.type}</span>
                                            <span className="text-slate-400 text-sm">{new Date(service.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="text-sm text-slate-300 space-y-1 mb-3">
                                            <p>Technician: {service.mechanic || 'N/A'}</p>
                                            <p className="text-slate-400 text-xs">{service.partsUsed.length} parts replaced</p>
                                            {service.notes && <p className="text-slate-400 italic">"{service.notes}"</p>}
                                        </div>
                                        <div className="flex justify-between items-end border-t border-slate-700 pt-3 mt-2">
                                            <span className="text-xs text-slate-500">ID: {service.id.slice(0, 8)}</span>
                                            <span className="text-emerald-400 font-bold">₹{service.totalCost}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Add Customer Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Customer & Vehicle">
                <form action={handleAddCustomer} className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Customer Name</label>
                        <input name="name" required className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Phone Number</label>
                            <input name="phone" required className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Email (Optional)</label>
                            <input name="email" type="email" className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white" />
                        </div>
                    </div>

                    <div className="border-t border-slate-700 pt-4 mt-2">
                        <h4 className="text-slate-300 font-medium mb-3">Vehicle Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Vehicle No.</label>
                                <input name="vehicleNumber" required placeholder="KA-01-XX-1234" className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Model Name</label>
                                <input name="modelName" required placeholder="e.g. Swift Dzire" className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm text-slate-400 mb-1">Vehicle Type</label>
                                <select name="vehicleType" className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white">
                                    <option>Car - Sedan</option>
                                    <option>Car - SUV</option>
                                    <option>Car - Hatchback</option>
                                    <option>Bike - Sport</option>
                                    <option>Bike - Commuter</option>
                                    <option>Scooter</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="w-full btn btn-primary mt-4">Register Customer</button>
                </form>
            </Modal>

            {/* Add Vehicle Modal */}
            <Modal isOpen={isAddVehicleModalOpen} onClose={() => setIsAddVehicleModalOpen(false)} title="Add New Vehicle">
                {customerForVehicle && (
                    <form action={handleAddVehicle} className="space-y-4">
                        <input type="hidden" name="customerId" value={customerForVehicle.id} />
                        <div className="bg-slate-800 p-3 rounded mb-4">
                            <p className="text-sm text-slate-400">Customer</p>
                            <p className="text-white font-medium">{customerForVehicle.name}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Vehicle No.</label>
                                <input name="vehicleNumber" required placeholder="KA-01-XX-1234" className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Model Name</label>
                                <input name="modelName" required placeholder="e.g. Swift Dzire" className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm text-slate-400 mb-1">Vehicle Type</label>
                                <select name="vehicleType" className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white">
                                    <option>Car - Sedan</option>
                                    <option>Car - SUV</option>
                                    <option>Car - Hatchback</option>
                                    <option>Bike - Sport</option>
                                    <option>Bike - Commuter</option>
                                    <option>Scooter</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="w-full btn btn-primary mt-4">Add Vehicle</button>
                    </form>
                )}
            </Modal>

            {/* Edit Customer Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Customer Details">
                {customerToEdit && (
                    <form action={handleUpdateCustomer} className="space-y-4">
                        <input type="hidden" name="id" value={customerToEdit.id} />
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Customer Name</label>
                            <input name="name" defaultValue={customerToEdit.name} required className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Phone Number</label>
                            <input name="phone" defaultValue={customerToEdit.phone} required className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Email</label>
                            <input name="email" defaultValue={customerToEdit.email} className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white" />
                        </div>

                        <div className="border-t border-slate-700 pt-4 mt-2">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm text-slate-300 font-medium">Linked Vehicles</label>
                                <button type="button" onClick={() => openAddVehicleModal(customerToEdit)} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded">
                                    + Add Vehicle
                                </button>
                            </div>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {customerToEdit.vehicles.map(v => (
                                    <div key={v.id} className="bg-slate-800 p-2 rounded text-xs flex justify-between items-center">
                                        <span className="text-slate-200">{v.modelName} ({v.vehicleNumber})</span>
                                        <span className="text-slate-500">{v.vehicleType}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="w-full btn btn-primary mt-4">Update Details</button>
                    </form>
                )}
            </Modal>
        </div>
    );
}
