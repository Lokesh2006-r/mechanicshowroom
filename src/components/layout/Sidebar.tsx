'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'Inventory & Stock', path: '/inventory', icon: '🔧' },
    { name: 'Customer Records', path: '/customers', icon: '👥' },
    { name: 'Service Billing', path: '/billing', icon: '📝' },
    { name: 'Analytics', path: '/analytics', icon: '📈' },
    { name: 'Admin Panel', path: '/admin', icon: '⚙️' },
];

export default function Sidebar({ onCloseMobile }: { onCloseMobile: () => void }) {
    const pathname = usePathname();

    return (
        <aside className="sidebar h-full flex flex-col p-6 w-full">
            <div className="mb-8 hidden md:block">
                <h1 className="text-xl font-bold text-white tracking-wider uppercase border-b border-gray-700 pb-4">
                    Mechanic Pro <span className="text-blue-500">Shop</span>
                </h1>
            </div>

            <div className="md:hidden mb-8 border-b border-gray-700 pb-4 flex justify-between items-center">
                <h2 className="text-lg font-bold text-white uppercase">Menu</h2>
                <button onClick={onCloseMobile} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <nav className="flex flex-col gap-2 flex-grow overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            onClick={onCloseMobile}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                ? 'bg-blue-600 text-white shadow-lg translate-x-1'
                                : 'text-gray-400 hover:bg-slate-700/50 hover:text-white hover:translate-x-1'
                                }`}
                        >
                            <span className={`text-xl transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto pt-8 border-t border-gray-700">
                <div className="flex items-center gap-3 px-4 py-2 hover:bg-slate-700/30 rounded-lg transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-lg font-bold text-blue-400 border-2 border-slate-600">
                        A
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white">Admin User</p>
                        <p className="text-xs text-gray-500">Workshop Owner</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
