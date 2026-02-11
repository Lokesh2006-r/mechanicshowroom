import fs from 'fs/promises';
import path from 'path';
import { Product, Customer } from '@/types';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Ensure data directory exists
async function ensureDb() {
    try {
        await fs.access(DB_PATH);
    } catch {
        await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
        await fs.writeFile(DB_PATH, JSON.stringify(initialData, null, 2));
    }
}

const initialData: { products: Product[]; customers: Customer[] } = {
    products: [
        { id: '1', name: 'Wrench Set (Pro)', category: 'Tool', supplier: 'Snap-on', price: 1500, gstRate: 18, quantity: 5, minStockAlert: 2 },
        { id: '2', name: 'Engine Oil 5W-40', category: 'Spare Part', supplier: 'Castrol', price: 850, gstRate: 18, quantity: 20, minStockAlert: 5 },
        { id: '3', name: 'Brake Pads (Front)', category: 'Spare Part', supplier: 'Bosch', price: 1200, gstRate: 18, quantity: 8, minStockAlert: 3 },
    ],
    customers: [
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
    ]
};

export async function getDb() {
    await ensureDb();
    const data = await fs.readFile(DB_PATH, 'utf-8');
    // If the file exists but has old structure, we might want to validate or migrate, 
    // but for now we assume it matches. 
    // In a real app, strict schema validation (zod) would be here.
    return JSON.parse(data) as typeof initialData;
}

export async function saveDb(data: typeof initialData) {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}
