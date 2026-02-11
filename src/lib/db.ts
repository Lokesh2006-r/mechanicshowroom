import dbConnect from './mongodb';
import { ProductModel, CustomerModel } from '@/models/models';
import { Product, Customer } from '@/types';

// Seed data — only used if the database is empty
const seedProducts: Product[] = [
    { id: '1', name: 'Wrench Set (Pro)', category: 'Tool', supplier: 'Snap-on', price: 1500, gstRate: 18, quantity: 5, minStockAlert: 2 },
    { id: '2', name: 'Engine Oil 5W-40', category: 'Spare Part', supplier: 'Castrol', price: 850, gstRate: 18, quantity: 20, minStockAlert: 5 },
    { id: '3', name: 'Brake Pads (Front)', category: 'Spare Part', supplier: 'Bosch', price: 1200, gstRate: 18, quantity: 8, minStockAlert: 3 },
];

const seedCustomers: Customer[] = [
    {
        id: 'c1',
        name: 'Rahul Sharma',
        phone: '9876543210',
        email: 'rahul@example.com',
        vehicles: [
            {
                id: 'v1',
                vehicleNumber: 'KA-01-AB-1234',
                modelName: 'Hyundai Verna',
                vehicleType: 'Car - Sedan',
                registrationDate: '2025-01-01',
                serviceHistory: [
                    {
                        id: 's1',
                        date: '2025-01-10T10:00:00.000Z',
                        type: 'General Service',
                        partsUsed: [{ productId: '2', quantity: 1, costAtService: 850 }],
                        serviceCharge: 2000,
                        gstAmount: 513,
                        totalCost: 3363
                    }
                ]
            }
        ]
    }
];

async function ensureSeeded() {
    await dbConnect();

    const productCount = await ProductModel.countDocuments();
    if (productCount === 0) {
        await ProductModel.insertMany(seedProducts);
        console.log('✅ Seeded products');
    }

    const customerCount = await CustomerModel.countDocuments();
    if (customerCount === 0) {
        await CustomerModel.insertMany(seedCustomers);
        console.log('✅ Seeded customers');
    }
}

export async function getDb(): Promise<{ products: Product[]; customers: Customer[] }> {
    await ensureSeeded();

    const productsRaw = await ProductModel.find({}).lean();
    const customersRaw = await CustomerModel.find({}).lean();

    // Convert Mongoose docs to plain objects matching our interfaces
    const products: Product[] = productsRaw.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        supplier: p.supplier,
        price: p.price,
        gstRate: p.gstRate,
        quantity: p.quantity,
        minStockAlert: p.minStockAlert,
    }));

    const customers: Customer[] = customersRaw.map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email || '',
        vehicles: (c.vehicles || []).map((v: any) => ({
            id: v.id,
            vehicleNumber: v.vehicleNumber,
            vehicleType: v.vehicleType,
            modelName: v.modelName,
            registrationDate: v.registrationDate || '',
            serviceHistory: (v.serviceHistory || []).map((s: any) => ({
                id: s.id,
                date: s.date,
                type: s.type,
                mechanic: s.mechanic || '',
                serviceCharge: s.serviceCharge,
                gstAmount: s.gstAmount,
                totalCost: s.totalCost,
                notes: s.notes || '',
                partsUsed: (s.partsUsed || []).map((p: any) => ({
                    productId: p.productId,
                    quantity: p.quantity,
                    costAtService: p.costAtService,
                    name: p.name || '',
                })),
            })),
        })),
    }));

    return { products, customers };
}

// saveDb is no longer needed for MongoDB — individual actions update directly.
// Keeping a stub for backward compatibility if any code still calls it.
export async function saveDb(_data: { products: Product[]; customers: Customer[] }) {
    // No-op: MongoDB is updated directly via model operations in actions.ts
    console.warn('saveDb() called but MongoDB uses direct model updates. This is a no-op.');
}
