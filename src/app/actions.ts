'use server';

import { getDb, saveDb } from '@/lib/db';
import { Product, Customer, ServiceRecord } from '@/types';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

export async function addProduct(formData: FormData) {
    const db = await getDb();

    const name = formData.get('name') as string;
    const category = formData.get('category') as 'Tool' | 'Spare Part';
    const supplier = formData.get('supplier') as string;
    const price = parseFloat(formData.get('price') as string);
    const gstRate = parseFloat(formData.get('gstRate') as string);
    const quantity = parseInt(formData.get('quantity') as string);
    const minStockAlert = parseInt(formData.get('minStockAlert') as string);

    const newProduct: Product = {
        id: randomUUID(),
        name,
        category,
        supplier,
        price,
        gstRate,
        quantity,
        minStockAlert
    };

    db.products.push(newProduct);
    await saveDb(db);
    revalidatePath('/inventory');
    revalidatePath('/'); // For stock alerts
    return { success: true };
}

export async function addCustomer(formData: FormData) {
    const db = await getDb();

    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const vehicleNumber = formData.get('vehicleNumber') as string;
    const vehicleType = formData.get('vehicleType') as string;
    const modelName = formData.get('modelName') as string || 'Unknown Model';
    const registrationDate = new Date().toISOString();

    const newVehicle: any = {
        id: randomUUID(),
        vehicleNumber,
        vehicleType,
        modelName,
        registrationDate,
        serviceHistory: []
    };

    const newCustomer: Customer = {
        id: randomUUID(),
        name,
        phone,
        email,
        vehicles: [newVehicle]
    };

    db.customers.push(newCustomer);
    await saveDb(db);
    revalidatePath('/customers');
    return { success: true };
}

export async function updateCustomer(formData: FormData) {
    // This function likely needs a full rewrite if the UI changes, 
    // but for now let's just update basic details and maybe the first vehicle?
    // To be safe, let's just update customer details.
    const db = await getDb();
    const id = formData.get('id') as string;

    const index = db.customers.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Customer not found');

    // Merge updates
    const customer = db.customers[index];
    customer.name = formData.get('name') as string;
    customer.phone = formData.get('phone') as string;
    customer.email = formData.get('email') as string;

    // Legacy support: if we updated vehicle details here before, we might need a specific 'updateVehicle' action now.
    // For now, ignoring vehicle updates in this specific action to avoid complexity.

    await saveDb(db);
    revalidatePath('/customers');
    return { success: true };
}

export async function saveService(customerId: string, vehicleId: string, serviceData: {
    date: string;
    type: string;
    mechanic: string;
    serviceCharge: number;
    parts: { productId: string; quantity: number }[];
    notes?: string;
}) {
    const db = await getDb();
    const customer = db.customers.find(c => c.id === customerId);
    if (!customer) throw new Error('Customer not found');

    const vehicle = customer.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) throw new Error('Vehicle not found');

    const partsUsedDetails = [];
    let totalPartsCost = 0;
    let totalPartsGst = 0;

    // Process parts and deduct stock
    for (const partItem of serviceData.parts) {
        const productIndex = db.products.findIndex(p => p.id === partItem.productId);
        if (productIndex === -1) continue;

        const product = db.products[productIndex];

        if (product.quantity < partItem.quantity) {
            throw new Error(`Insufficient stock for ${product.name}`);
        }

        // Deduct stock
        product.quantity -= partItem.quantity;

        const cost = product.price * partItem.quantity;
        const gst = cost * (product.gstRate / 100);

        totalPartsCost += cost;
        totalPartsGst += gst;

        partsUsedDetails.push({
            productId: product.id,
            quantity: partItem.quantity,
            costAtService: product.price,
            name: product.name
        });
    }

    // Calculate Service GST (18%)
    const serviceGst = serviceData.serviceCharge * 0.18;
    const totalGst = totalPartsGst + serviceGst;
    const totalCost = serviceData.serviceCharge + totalPartsCost + totalGst;

    const newService: ServiceRecord = {
        id: randomUUID(),
        date: serviceData.date,
        type: serviceData.type,
        mechanic: serviceData.mechanic,
        partsUsed: partsUsedDetails,
        serviceCharge: serviceData.serviceCharge,
        gstAmount: totalGst,
        totalCost: totalCost,
        notes: serviceData.notes
    };

    vehicle.serviceHistory.push(newService);

    await saveDb(db);
    revalidatePath('/');
    revalidatePath('/customers');
    revalidatePath('/inventory');
    revalidatePath('/billing');

    return { success: true, serviceId: newService.id };
}

export async function addVehicle(formData: FormData) {
    const db = await getDb();
    const customerId = formData.get('customerId') as string;

    const customerIndex = db.customers.findIndex(c => c.id === customerId);
    if (customerIndex === -1) throw new Error('Customer not found');

    const customer = db.customers[customerIndex];

    const vehicleNumber = formData.get('vehicleNumber') as string;
    const vehicleType = formData.get('vehicleType') as string;
    const modelName = formData.get('modelName') as string || 'Unknown Model';
    const registrationDate = new Date().toISOString();

    const newVehicle: any = {
        id: randomUUID(),
        vehicleNumber,
        vehicleType,
        modelName,
        registrationDate,
        serviceHistory: []
    };

    customer.vehicles.push(newVehicle);
    await saveDb(db);
    revalidatePath('/customers');
    return { success: true };
}
