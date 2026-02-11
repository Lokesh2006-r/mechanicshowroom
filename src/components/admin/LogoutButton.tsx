'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleLogout() {
        setLoading(true);
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/admin/login');
            router.refresh();
        } catch {
            alert('Logout failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className="bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 text-xs px-4 py-1.5 rounded-full border border-red-500/30 hover:border-red-500/50 transition-all font-medium flex items-center gap-1.5"
        >
            {loading ? '...' : '🚪 Logout'}
        </button>
    );
}
