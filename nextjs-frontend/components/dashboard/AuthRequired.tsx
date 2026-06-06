'use client';

import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';

export default function AuthRequired({ message = 'Please login to continue.' }: { message?: string }) {
    const router = useRouter();
    
    return (
        <div className="h-[500px] flex flex-col items-center justify-center text-center space-y-8 bg-white rounded-[48px] border border-slate-100 shadow-sm">
            <div className="w-24 h-24 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-500 border border-orange-100 shadow-xl shadow-orange-500/10 animate-pulse">
                <Shield size={48} />
            </div>
            <div className="space-y-3 px-6">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Access Required</h2>
                <p className="text-slate-500 text-lg max-w-md mx-auto leading-relaxed font-medium">{message}</p>
                <button 
                    onClick={() => router.push('/login')}
                    className="mt-6 px-12 py-5 orange-gradient text-white rounded-2xl font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-orange-500/30"
                >
                    Go to Login
                </button>
            </div>
        </div>
    );
}
