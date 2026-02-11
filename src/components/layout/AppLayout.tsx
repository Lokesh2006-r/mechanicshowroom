'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { usePathname } from 'next/navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    // Skip sidebar for login page
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">

            {/* Mobile Header */}
            <div className="md:hidden bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center sticky top-0 z-40 shadow-md">
                <h1 className="text-lg font-bold uppercase tracking-wider">
                    Mechanic <span className="text-blue-500">Pro</span>
                </h1>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                    {isSidebarOpen ? '✕' : '☰'}
                </button>
            </div>

            {/* Sidebar with Mobile Logic */}
            <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen md:sticky md:top-0
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
                <Sidebar onCloseMobile={() => setIsSidebarOpen(false)} />
            </div>

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto h-auto md:h-screen scroll-smooth">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
