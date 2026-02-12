import LoginForm from '@/components/auth/LoginForm';

export default function AdminLoginPage() {
    return (
        // Reusing the global layout, just centering the form
        <div className="flex bg-slate-900 min-h-screen items-center justify-center">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
                <div className="absolute top-[40%] right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <LoginForm role="admin" />
            </div>
        </div>
    );
}
