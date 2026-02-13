'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { usePathname } from 'next/navigation';
import { User } from '@/types';

export default function AppLayout({ children, user }: { children: React.ReactNode; user?: User | null }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    // Skip sidebar for login pages
    if (pathname === '/admin/login' || pathname.startsWith('/login')) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row" style={{
            background: '#1a1a2e',
        }}>
            {/* Mobile Header — macOS-style toolbar */}
            <div className="md:hidden sticky top-0 z-40 flex justify-between items-center px-4 py-3"
                style={{
                    background: 'rgba(18, 18, 36, 0.85)',
                    backdropFilter: 'blur(20px) saturate(1.5)',
                    WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-xs shadow-lg shadow-blue-500/20">
                        🔧
                    </div>
                    <h1 className="text-sm font-bold text-white tracking-tight">
                        Mechanic <span className="text-[#007AFF]">Pro</span>
                    </h1>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all"
                    style={{
                        background: 'rgba(255,255,255,0.06)',
                        color: '#86868B',
                    }}
                >
                    {isSidebarOpen ? '✕' : '☰'}
                </button>
            </div>

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-60 transform transition-transform duration-300 ease-out
                md:translate-x-0 md:static md:h-screen md:sticky md:top-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `} style={{
                    borderRight: '1px solid rgba(255,255,255,0.04)',
                }}>
                <Sidebar onCloseMobile={() => setIsSidebarOpen(false)} user={user} />
            </div>

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 md:hidden"
                    style={{
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                    }}
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto h-auto md:h-screen scroll-smooth relative">
                {/* Subtle top toolbar line */}
                <div className="hidden md:block sticky top-0 z-10 h-10" style={{
                    background: 'linear-gradient(180deg, rgba(26,26,46,0.95) 0%, rgba(26,26,46,0) 100%)',
                    pointerEvents: 'none',
                }}></div>

                <div className="max-w-7xl mx-auto relative z-1 -mt-4 md:-mt-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
