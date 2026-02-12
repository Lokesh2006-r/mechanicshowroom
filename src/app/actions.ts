'use server';

import dbConnect from '@/lib/mongodb';
import { ProductModel, CustomerModel, UserModel } from '@/models/models';
import { Product, Customer, ServiceRecord } from '@/types';
import { revalidatePath } from 'next/cache';
import { randomUUID, createHash } from 'crypto';
import { cookies } from 'next/headers';

// Helper to hash password (simple SHA256 for prototype)
function hashPassword(password: string) {
    return createHash('sha256').update(password).digest('hex');
}


export async function addProduct(formData: FormData) {
    await dbConnect();

    const name = formData.get('name') as string;
    const category = formData.get('category') as 'Tool' | 'Spare Part';
    const supplier = formData.get('supplier') as string;
    const price = parseFloat(formData.get('price') as string);
    const gstRate = parseFloat(formData.get('gstRate') as string);
    const quantity = parseInt(formData.get('quantity') as string);
    const minStockAlert = parseInt(formData.get('minStockAlert') as string);

    await ProductModel.create({
        id: randomUUID(),
        name,
        category,
        supplier,
        price,
        gstRate,
        quantity,
        minStockAlert
    });

    revalidatePath('/inventory');
    revalidatePath('/');
    return { success: true };
}

export async function addCustomer(formData: FormData) {
    await dbConnect();

    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const vehicleNumber = formData.get('vehicleNumber') as string;
    const vehicleType = formData.get('vehicleType') as string;
    const modelName = formData.get('modelName') as string || 'Unknown Model';
    const registrationDate = new Date().toISOString();

    await CustomerModel.create({
        id: randomUUID(),
        name,
        phone,
        email,
        vehicles: [{
            id: randomUUID(),
            vehicleNumber,
            vehicleType,
            modelName,
            registrationDate,
            serviceHistory: []
        }]
    });

    revalidatePath('/customers');
    return { success: true };
}

export async function updateCustomer(formData: FormData) {
    await dbConnect();
    const id = formData.get('id') as string;

    const result = await CustomerModel.findOneAndUpdate(
        { id },
        {
            $set: {
                name: formData.get('name') as string,
                phone: formData.get('phone') as string,
                email: formData.get('email') as string,
            }
        },
        { new: true }
    );

    if (!result) throw new Error('Customer not found');

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
    await dbConnect();

    const customer = await CustomerModel.findOne({ id: customerId });
    if (!customer) throw new Error('Customer not found');

    const vehicle = (customer.vehicles as any[]).find((v: any) => v.id === vehicleId);
    if (!vehicle) throw new Error('Vehicle not found');

    const partsUsedDetails: any[] = [];
    let totalPartsCost = 0;
    let totalPartsGst = 0;

    // Process parts and deduct stock
    for (const partItem of serviceData.parts) {
        if (!partItem.productId) continue;

        const product = await ProductModel.findOne({ id: partItem.productId });
        if (!product) continue;

        if (product.quantity < partItem.quantity) {
            throw new Error(`Insufficient stock for ${product.name}`);
        }

        // Deduct stock in MongoDB
        await ProductModel.updateOne(
            { id: partItem.productId },
            { $inc: { quantity: -partItem.quantity } }
        );

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

    const newService = {
        id: randomUUID(),
        date: serviceData.date,
        type: serviceData.type,
        mechanic: serviceData.mechanic,
        partsUsed: partsUsedDetails,
        serviceCharge: serviceData.serviceCharge,
        gstAmount: totalGst,
        totalCost: totalCost,
        notes: serviceData.notes || ''
    };

    // Push the service record to the correct vehicle
    await CustomerModel.updateOne(
        { id: customerId, 'vehicles.id': vehicleId },
        { $push: { 'vehicles.$.serviceHistory': newService } }
    );

    revalidatePath('/');
    revalidatePath('/customers');
    revalidatePath('/inventory');
    revalidatePath('/billing');

    return { success: true, serviceId: newService.id };
}

export async function addVehicle(formData: FormData) {
    await dbConnect();
    const customerId = formData.get('customerId') as string;

    const vehicleNumber = formData.get('vehicleNumber') as string;
    const vehicleType = formData.get('vehicleType') as string;
    const modelName = formData.get('modelName') as string || 'Unknown Model';
    const registrationDate = new Date().toISOString();

    const newVehicle = {
        id: randomUUID(),
        vehicleNumber,
        vehicleType,
        modelName,
        registrationDate,
        serviceHistory: []
    };

    const result = await CustomerModel.updateOne(
        { id: customerId },
        { $push: { vehicles: newVehicle } }
    );

    if (result.matchedCount === 0) throw new Error('Customer not found');

    revalidatePath('/customers');
    return { success: true };
}

// ==================== ADMIN ACTIONS ====================

export async function updateProduct(productId: string, updates: Partial<{
    name: string;
    category: string;
    supplier: string;
    price: number;
    gstRate: number;
    quantity: number;
    minStockAlert: number;
}>) {
    await dbConnect();

    const result = await ProductModel.findOneAndUpdate(
        { id: productId },
        { $set: updates },
        { new: true }
    );

    if (!result) throw new Error('Product not found');

    revalidatePath('/');
    revalidatePath('/inventory');
    revalidatePath('/billing');
    revalidatePath('/admin');
    return { success: true };
}

export async function deleteProduct(productId: string) {
    await dbConnect();

    const result = await ProductModel.deleteOne({ id: productId });
    if (result.deletedCount === 0) throw new Error('Product not found');

    revalidatePath('/');
    revalidatePath('/inventory');
    revalidatePath('/admin');
    return { success: true };
}

export async function deleteCustomer(customerId: string) {
    await dbConnect();

    const result = await CustomerModel.deleteOne({ id: customerId });
    if (result.deletedCount === 0) throw new Error('Customer not found');

    revalidatePath('/');
    revalidatePath('/customers');
    revalidatePath('/admin');
    return { success: true };
}

// ==================== AUTH ACTIONS ====================

export async function loginUser(formData: FormData) {
    await dbConnect();
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const expectedRole = formData.get('role') as string; // 'admin' or 'employee'

    // Seed users if DB is empty (quick hack for prototype setup)
    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
        console.log('Seeding default users...');
        await UserModel.create([
            { id: randomUUID(), username: 'admin', passwordHash: hashPassword('admin123'), role: 'admin', name: 'Admin User' },
            { id: randomUUID(), username: 'employee', passwordHash: hashPassword('emp123'), role: 'employee', name: 'Employee User' }
        ]);
    }

    const user = await UserModel.findOne({ username });
    if (!user) {
        throw new Error('Invalid username or password');
    }

    if (hashPassword(password) !== user.passwordHash) {
        throw new Error('Invalid username or password');
    }

    if (user.role !== expectedRole) {
        // Security: Maybe don't reveal role mismatch, but for UI clarity:
        throw new Error(`This account is not authorized for ${expectedRole} login.`);
    }

    // Set cookie
    const sessionData = JSON.stringify({ id: user.id, username: user.username, role: user.role, name: user.name });

    // Valid for 24 hours
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    (await cookies()).set('session', sessionData, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        expires
    });

    return { success: true, role: user.role };
}

export async function logoutUser() {
    (await cookies()).delete('session');
    // Using redirect here might valid
}

export async function getFinancialReport(startDate: string, endDate: string) {
    await dbConnect();

    // Ensure endDate covers the full day (lexicographically)
    const endDateTime = endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`;

    // Aggregation pipeline to sum up stats across all customers' service history
    // We treat 'date' as string (ISO), so string comparison works.
    const result = await CustomerModel.aggregate([
        { $unwind: "$vehicles" },
        { $unwind: "$vehicles.serviceHistory" },
        {
            $match: {
                "vehicles.serviceHistory.date": {
                    $gte: startDate,
                    $lte: endDateTime
                }
            }
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$vehicles.serviceHistory.totalCost" },
                totalGST: { $sum: "$vehicles.serviceHistory.gstAmount" },
                totalServiceCharge: { $sum: "$vehicles.serviceHistory.serviceCharge" },
                serviceCount: { $sum: 1 }
            }
        }
    ]);

    const stats = result[0] || { totalRevenue: 0, totalGST: 0, totalServiceCharge: 0, serviceCount: 0 };

    // Derived Metrics
    // Labor GST = Service Charge * 0.18
    const laborGST = stats.totalServiceCharge * 0.18;
    const laborGross = stats.totalServiceCharge + laborGST;

    // Parts Gross = Total Revenue - Labor Gross
    const partsGross = stats.totalRevenue - laborGross;

    // Parts GST = Total GST - Labor GST
    const partsGST = stats.totalGST - laborGST;

    // Parts Net = Parts Gross - Parts GST
    const partsNet = partsGross - partsGST;

    return {
        totalRevenue: stats.totalRevenue,
        totalGST: stats.totalGST,
        serviceCount: stats.serviceCount,
        laborRevenue: stats.totalServiceCharge, // Net Labor
        partsRevenue: partsNet, // Net Parts
        laborGross,
        partsGross
    };
}
