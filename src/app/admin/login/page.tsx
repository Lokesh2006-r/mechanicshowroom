'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (data.success) {
                router.push('/admin');
                router.refresh();
            } else {
                setError(data.message || 'Invalid credentials');
            }
        } catch {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#1a1a2e' }}>
            {/* macOS-style ambient glow */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl"
                    style={{ background: 'rgba(0, 122, 255, 0.06)', animation: 'floatGlow 8s ease-in-out infinite' }}></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl"
                    style={{ background: 'rgba(175, 82, 222, 0.05)', animation: 'floatGlow 10s ease-in-out infinite 2s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl"
                    style={{ background: 'rgba(48, 209, 88, 0.03)' }}></div>
            </div>

            <div className="w-full max-w-sm relative z-10 animate-mac-bounce">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-3xl mb-4"
                        style={{
                            background: 'linear-gradient(135deg, #007AFF, #5856D6)',
                            boxShadow: '0 8px 32px rgba(0, 122, 255, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                        }}>
                        🔧
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        Mechanic <span style={{ color: '#007AFF' }}>Pro</span>
                    </h1>
                    <p className="text-[13px] mt-1" style={{ color: '#86868B' }}>Admin Control Panel</p>
                </div>

                {/* macOS Window-style Login Card */}
                <div style={{
                    background: 'rgba(30, 30, 56, 0.8)',
                    backdropFilter: 'blur(40px) saturate(1.8)',
                    WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    boxShadow: '0 22px 70px 4px rgba(0,0,0,0.56), 0 0 0 1px rgba(255,255,255,0.03) inset',
                    overflow: 'hidden',
                }}>
                    {/* Titlebar */}
                    <div className="flex items-center gap-2 px-4 py-3" style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        <span className="w-3 h-3 rounded-full" style={{ background: '#FF5F57', boxShadow: '0 0 4px rgba(255,95,87,0.4)' }}></span>
                        <span className="w-3 h-3 rounded-full" style={{ background: '#FFBD2E', boxShadow: '0 0 4px rgba(255,189,46,0.4)' }}></span>
                        <span className="w-3 h-3 rounded-full" style={{ background: '#28C840', boxShadow: '0 0 4px rgba(40,200,64,0.4)' }}></span>
                        <span className="flex-1 text-center text-[12px] font-medium pr-12" style={{ color: '#5A5A6E' }}>Sign In</span>
                    </div>

                    {/* Form */}
                    <div className="p-6">
                        <h2 className="text-lg font-bold text-white mb-0.5">Welcome back</h2>
                        <p className="text-[13px] mb-5" style={{ color: '#86868B' }}>Sign in to access the admin dashboard</p>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#86868B' }}>Username</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#5A5A6E' }}>👤</span>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        placeholder="Enter username"
                                        required
                                        autoComplete="username"
                                        className="w-full pl-9 pr-4 py-2.5 text-[13px] text-white rounded-lg"
                                        style={{
                                            background: 'rgba(0, 0, 0, 0.3)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#86868B' }}>Password</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#5A5A6E' }}>🔒</span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Enter password"
                                        required
                                        autoComplete="current-password"
                                        className="w-full pl-9 pr-10 py-2.5 text-[13px] text-white rounded-lg"
                                        style={{
                                            background: 'rgba(0, 0, 0, 0.3)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm transition-colors"
                                        style={{ color: '#5A5A6E' }}
                                    >
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-lg p-2.5 flex items-center gap-2" style={{
                                    background: 'rgba(255,69,58,0.08)',
                                    border: '1px solid rgba(255,69,58,0.15)',
                                }}>
                                    <span className="text-[13px]" style={{ color: '#FF453A' }}>⚠️ {error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !username || !password}
                                className="w-full text-white font-semibold py-2.5 rounded-lg text-[13px] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
                                style={{
                                    background: '#007AFF',
                                    boxShadow: '0 2px 8px rgba(0,122,255,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
                                }}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                        </svg>
                                        Signing in...
                                    </span>
                                ) : 'Sign In →'}
                            </button>
                        </form>
                    </div>
                </div>

                <p className="text-center text-[11px] mt-5" style={{ color: '#5A5A6E' }}>
                    🔒 Secure admin access only
                </p>
            </div>
        </div>
    );
}
