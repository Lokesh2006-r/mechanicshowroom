'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '@/app/actions';

interface LoginFormProps {
    role?: 'admin' | 'employee';
}

export default function LoginForm({ role }: LoginFormProps) {
    // If a role is passed, use it and don't allow switching (legacy mode if needed)
    // or just default to it. Let's make it flexible:
    // If role is passed, we can still allow switching but default to that role.
    const [selectedRole, setSelectedRole] = useState<'admin' | 'employee'>(role || 'employee');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        // Ensure role is correctly set from our state
        formData.set('role', selectedRole);

        try {
            const result = await loginUser(formData);
            if (result.success) {
                // Redirect user
                router.push('/');
                router.refresh();
            } else {
                setError(result.error || 'Login failed');
                setLoading(false);
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-sm glass-panel p-8 animate-fade-in relative z-10">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2 capitalize">
                        Welcome Back
                    </h1>
                    <p className="text-sm text-slate-400">Sign in to access the showroom system</p>
                </div>

                {/* Role Switcher */}
                <div className="flex p-1 bg-slate-800/50 rounded-lg mb-6 border border-white/5">
                    <button
                        type="button"
                        onClick={() => setSelectedRole('admin')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${selectedRole === 'admin'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                    >
                        Admin
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedRole('employee')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${selectedRole === 'employee'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                    >
                        Employee
                    </button>
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

                    {/* Hidden input to ensure FormData picks it up if JS fails, though handleSubmit overrides it */}
                    <input type="hidden" name="role" value={selectedRole} />

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full btn mt-4 relative overflow-hidden group transition-all ${selectedRole === 'admin' ? 'btn-primary' : '!bg-emerald-600 hover:!bg-emerald-500 text-white'
                            }`}
                    >
                        <span className="relative z-10">{loading ? 'Verifying...' : `Sign In as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}</span>
                        {loading && (
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
