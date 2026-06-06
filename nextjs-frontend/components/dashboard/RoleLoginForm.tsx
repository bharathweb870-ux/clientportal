'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, Loader2 } from 'lucide-react';
import { resolveApiBaseUrl } from '@/lib/api';
import { setRoleSession } from '@/lib/auth';

interface LoginPageProps {
    role: 'admin' | 'agent' | 'client';
}

// Shared login form used by all 3 role-specific pages
export default function RoleLoginForm({ role }: LoginPageProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const roleConfig = {
        admin: {
            label: 'Admin Portal',
            sub: 'Executive Management Access',
            placeholder: 'admin@webbuilders.lk',
            redirect: '/admin',
            tokenKey: 'admin_token',
            color: 'from-slate-900 to-slate-700',
        },
        agent: {
            label: 'Agent Workspace',
            sub: 'Strategic Sales Partner Access',
            placeholder: 'agent@webbuilders.lk',
            redirect: '/agent',
            tokenKey: 'agent_token',
            color: 'from-orange-600 to-orange-400',
        },
        client: {
            label: 'Client Portal',
            sub: 'Premium Account Access',
            placeholder: 'you@company.com',
            redirect: '/client',
            tokenKey: 'client_token',
            color: 'from-blue-600 to-blue-400',
        },
    };

    const config = roleConfig[role];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(
                `${resolveApiBaseUrl()}/login`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ email, password }),
                }
            );
            const data = await res.json();

            if (!res.ok) {
                setError(data.message || 'Authentication failed.');
                return;
            }

            const { access_token, user } = data;

            // Verify the user is logging into the correct portal
            if (user.role !== role) {
                setError(`This portal is for ${role}s only. Your account role is "${user.role}".`);
                return;
            }

            // Store token under ROLE-SPECIFIC key — prevents cross-tab contamination
            setRoleSession(role, access_token, user);

            router.push(config.redirect);
        } catch {
            setError('Server unreachable. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 font-[Outfit] p-6">
            <div className="w-full max-w-[480px] bg-white rounded-[48px] p-12 shadow-2xl shadow-slate-200 border border-slate-100 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${config.color} opacity-5 rounded-full -mr-32 -mt-32 blur-3xl`}></div>

                <div className="text-center mb-12 relative z-10">
                    <div className={`w-20 h-20 bg-gradient-to-br ${config.color} rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-2xl`}>
                        <Shield size={40} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">{config.label}</h1>
                    <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-[10px]">{config.sub}</p>
                </div>

                {error && (
                    <div className="mb-8 p-5 bg-red-50 border border-red-100 text-red-600 rounded-3xl text-sm font-bold animate-in slide-in-from-top duration-300">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={20} />
                            <input
                                type="email" required value={email}
                                autoComplete="email"
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-[24px] text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all placeholder-slate-300"
                                placeholder={config.placeholder}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={20} />
                            <input
                                type="password" required value={password}
                                autoComplete="current-password"
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-[24px] text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all placeholder-slate-300"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit" disabled={loading}
                        className={`w-full py-6 bg-gradient-to-r ${config.color} text-white font-black uppercase tracking-[0.2em] rounded-[24px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs`}
                    >
                        {loading ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'Login'}
                    </button>
                </form>

                <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] mt-10">
                    © 2026 WebBuilders Strategic
                </p>
            </div>
        </div>
    );
}
