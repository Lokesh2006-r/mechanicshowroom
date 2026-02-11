
import mongoose, { Schema, Model, Document } from 'mongoose';
import { Product, Customer, ServiceRecord } from '@/types/index';

// Products Schema
// We'll use the 'randomUUID' logic if needed, but Mongo uses `_id` by default.
// To stick to the existing app logic, we'll maintain our own string 'id' or map to _id.
// It's safer to *mirror* the string 'id' from Mongo's _id for consistency.

const ProductSchema = new Schema<Product>({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, enum: ['Tool', 'Spare Part'], required: true },
    quantity: { type: Number, required: true, default: 0 },
    supplier: { type: String, required: true },
    price: { type: Number, required: true },
    gstRate: { type: Number, required: true },
    minStockAlert: { type: Number, default: 10 }
});

// Vehicle Schema (Embedded or separate? Embedded is likely best for this use case as per Customer usage)
const VehicleSchema = new Schema({
    id: { type: String, required: true }, // Internal ID
    vehicleNumber: { type: String, required: true },
    vehicleType: { type: String, required: true },
    modelName: { type: String, required: true },
    registrationDate: { type: String },

    // Service History (Could be large, but for now embedding is okay)
    serviceHistory: [{
        id: { type: String, required: true },
        date: { type: String, required: true },
        type: { type: String, required: true },
        mechanic: { type: String },
        serviceCharge: { type: Number, required: true },
        gstAmount: { type: Number, required: true },
        totalCost: { type: Number, required: true },
        notes: { type: String },
        partsUsed: [{
            productId: { type: String, required: true },
            name: { type: String },
            quantity: { type: Number, required: true },
            costAtService: { type: Number, required: true }
        }]
    }]
});

// Customer Schema
const CustomerSchema = new Schema<Customer>({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    vehicles: [VehicleSchema]
});

// Create Models (singleton pattern check)
export const ProductModel = (mongoose.models.Product as Model<Product>) || mongoose.model<Product>('Product', ProductSchema);
export const CustomerModel = (mongoose.models.Customer as Model<Customer>) || mongoose.model<Customer>('Customer', CustomerSchema);
