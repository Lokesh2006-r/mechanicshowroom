export default function LoginLandingPage() {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="glass-panel max-w-2xl w-full p-10 text-center animate-mac-bounce">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
                    Mechanic Pro Shop
                </h1>
                <p className="text-slate-400 mb-8">Select your role to continue</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <a href="/login/admin"
                        className="group p-6 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-all hover:-translate-y-1 block">
                        <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <span className="text-3xl">👨‍💼</span>
                        </div>
                        <h3 className="text-xl font-bold text-blue-400 mb-2">Admin</h3>
                        <p className="text-sm text-slate-400">Manage products, users, and full system access.</p>
                    </a>

                    <a href="/login/employee"
                        className="group p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all hover:-translate-y-1 block">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <span className="text-3xl">🔧</span>
                        </div>
                        <h3 className="text-xl font-bold text-emerald-400 mb-2">Employee</h3>
                        <p className="text-sm text-slate-400">Bill customers, view inventory, and create service cards.</p>
                    </a>
                </div>
            </div>
        </div>
    );
}
