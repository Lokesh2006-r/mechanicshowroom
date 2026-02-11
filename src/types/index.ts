export interface Product {
    id: string;
    name: string;
    category: 'Tool' | 'Spare Part';
    supplier: string;
    price: number;
    gstRate: number;
    quantity: number;
    minStockAlert: number;
}

export interface ServiceRecord {
    id: string;
    date: string; // ISO String
    type: string; // 'Oil Change', 'General Service', etc.
    partsUsed: { productId: string; quantity: number; costAtService: number; name?: string }[];
    serviceCharge: number;
    gstAmount: number;
    totalCost: number;
    mechanic?: string;
    notes?: string;
}

export interface Vehicle {
    id: string;
    vehicleNumber: string; // e.g., KA-01-AB-1234
    vehicleType: string;   // e.g., Car - Sedan, Bike - Sport
    modelName: string;     // e.g., Hyundai Verna
    registrationDate: string;
    serviceHistory: ServiceRecord[];
}

export interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    vehicles: Vehicle[];
}

export interface ShopStats {
    totalRevenue: number;
    totalStockValue: number;
    lowStockItems: number;
    servicesDueToday: number;
}
