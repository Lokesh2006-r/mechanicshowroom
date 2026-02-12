// Employee / Mechanic type
export interface Mechanic {
    id: string;
    name: string;
    phone: string;
    role: 'Senior Mechanic' | 'Junior Mechanic' | 'Specialist' | 'Trainee';
    specialization: string;
    joinDate: string; // ISO date string
    status: 'Active' | 'On Leave' | 'Inactive';
    dailyWage: number;
}

// Shared mechanic/employee data used across the application
export const MECHANICS_DATA: Mechanic[] = [
    {
        id: 'mech-1',
        name: 'Raju Kumar',
        phone: '9876543001',
        role: 'Senior Mechanic',
        specialization: 'Engine & Transmission',
        joinDate: '2022-03-15',
        status: 'Active',
        dailyWage: 800,
    },
    {
        id: 'mech-2',
        name: 'Suresh Patel',
        phone: '9876543002',
        role: 'Senior Mechanic',
        specialization: 'Electrical & AC',
        joinDate: '2021-06-10',
        status: 'Active',
        dailyWage: 850,
    },
    {
        id: 'mech-3',
        name: 'Vikram Singh',
        phone: '9876543003',
        role: 'Specialist',
        specialization: 'Brake & Suspension',
        joinDate: '2023-01-20',
        status: 'Active',
        dailyWage: 900,
    },
    {
        id: 'mech-4',
        name: 'Arjun Sharma',
        phone: '9876543004',
        role: 'Junior Mechanic',
        specialization: 'General Service',
        joinDate: '2024-05-08',
        status: 'Active',
        dailyWage: 550,
    },
    {
        id: 'mech-5',
        name: 'Manoj Yadav',
        phone: '9876543005',
        role: 'Junior Mechanic',
        specialization: 'Oil & Fluid Services',
        joinDate: '2024-08-12',
        status: 'On Leave',
        dailyWage: 500,
    },
    {
        id: 'mech-6',
        name: 'Deepak Verma',
        phone: '9876543006',
        role: 'Specialist',
        specialization: 'Body Work & Paint',
        joinDate: '2022-11-01',
        status: 'Active',
        dailyWage: 950,
    },
    {
        id: 'mech-7',
        name: 'Sanjay Gupta',
        phone: '9876543007',
        role: 'Senior Mechanic',
        specialization: 'Diesel Engines',
        joinDate: '2020-09-25',
        status: 'Active',
        dailyWage: 900,
    },
    {
        id: 'mech-8',
        name: 'Amit Chauhan',
        phone: '9876543008',
        role: 'Trainee',
        specialization: 'General Service',
        joinDate: '2025-01-10',
        status: 'Active',
        dailyWage: 350,
    },
];

// Simple name list for dropdowns (backward compatible)
export const MECHANICS_LIST = MECHANICS_DATA.map(m => m.name);
