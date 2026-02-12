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
        <aside className="h-full flex flex-col w-full" style={{
            background: 'rgba(18, 18, 36, 0.92)',
            backdropFilter: 'blur(40px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
        }}>
            {/* macOS-style Titlebar */}
            <div className="px-5 pt-5 pb-3 hidden md:block">
                <div className="flex items-center gap-2 mb-5">
                    <span className="w-3 h-3 rounded-full bg-[#FF5F57] shadow-[0_0_4px_rgba(255,95,87,0.4)]"></span>
                    <span className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-[0_0_4px_rgba(255,189,46,0.4)]"></span>
                    <span className="w-3 h-3 rounded-full bg-[#28C840] shadow-[0_0_4px_rgba(40,200,64,0.4)]"></span>
                </div>
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-lg shadow-lg shadow-blue-500/20">
                        🔧
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-white tracking-tight">
                            Mechanic <span className="text-[#007AFF]">Pro</span>
                        </h1>
                        <p className="text-[10px] text-[#86868B] font-medium">Workshop Management</p>
                    </div>
                </div>
            </div>

            {/* Mobile header */}
            <div className="md:hidden px-5 pt-5 pb-3 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-sm">
                        🔧
                    </div>
                    <span className="font-bold text-sm text-white">Menu</span>
                </div>
                <button onClick={onCloseMobile} className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs text-[#86868B] hover:text-white transition-all">✕</button>
            </div>

            {/* Separator line */}
            <div className="mx-5 border-t border-white/5 hidden md:block"></div>

            {/* Navigation - dock style */}
            <nav className="flex flex-col gap-1 flex-grow overflow-y-auto py-4 px-3">
                <p className="text-[10px] font-semibold text-[#5A5A6E] uppercase tracking-widest px-3 mb-2">Navigation</p>
                {menuItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            onClick={onCloseMobile}
                            className={`
                                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
                                ${isActive
                                    ? 'text-white'
                                    : 'text-[#86868B] hover:text-white'
                                }
                            `}
                            style={isActive ? {
                                background: 'rgba(0, 122, 255, 0.15)',
                                boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.06)',
                            } : {}}
                        >
                            {/* Active indicator — macOS accent bar */}
                            {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-[#007AFF] shadow-[0_0_8px_rgba(0,122,255,0.5)]"></span>
                            )}
                            <span className={`text-lg transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                {item.icon}
                            </span>
                            <span className={`text-[13px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* macOS-style User chip */}
            <div className="px-3 pb-5 pt-2 border-t border-white/5">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#5856D6] to-[#AF52DE] flex items-center justify-center text-sm font-bold text-white shadow-md relative">
                        A
                        {/* Online status dot */}
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#28C840] border-2 border-[#121224] shadow-[0_0_6px_rgba(40,200,64,0.5)]"></span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">Admin User</p>
                        <p className="text-[10px] text-[#5A5A6E] truncate">Workshop Owner</p>
                    </div>
                    <span className="text-[#5A5A6E] group-hover:text-[#86868B] transition-colors text-xs">⋯</span>
                </div>
            </div>
        </aside>
    );
}
