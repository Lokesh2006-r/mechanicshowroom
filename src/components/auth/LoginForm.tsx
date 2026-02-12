'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '@/app/actions';

interface LoginFormProps {
    role: 'admin' | 'employee';
}

export default function LoginForm({ role }: LoginFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        formData.append('role', role);

        try {
            const result = await loginUser(formData);
            if (result.success) {
                // Redirect user
                router.push('/');
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-sm glass-panel p-8 animate-fade-in relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2 capitalize">
                        {role} Portal
                    </h1>
                    <p className="text-sm text-slate-400">Sign in to access the showroom system</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Username</label>
                        <input
                            name="username"
                            type="text"
                            required
                            className="input-field w-full"
                            placeholder="Enter username"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="input-field w-full"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn btn-primary mt-4 relative overflow-hidden group"
                    >
                        <span className="relative z-10">{loading ? 'Verifying...' : 'Sign In'}</span>
                        {loading && (
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <a href={role === 'admin' ? '/login/employee' : '/login/admin'}
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                        Switch to {role === 'admin' ? 'Employee' : 'Admin'} Login
                    </a>
                </div>
            </div>
        </div>
    );
}
