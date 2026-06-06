'use client';

import Link from 'next/link';
import { Shield, UserCircle, Users } from 'lucide-react';

// /login → portal selection landing page
export default function LoginSelectPage() {
    const portals = [
        {
            role: 'Admin',
            icon: Shield,
            desc: 'Executive management & full system access',
            href: '/login/admin',
            gradient: 'from-slate-900 to-slate-700',
            shadow: 'shadow-slate-900/20',
            ring: 'hover:ring-slate-900/20',
        },
        {
            role: 'Agent',
            icon: UserCircle,
            desc: 'Manage your clients and track commissions',
            href: '/login/agent',
            gradient: 'from-orange-600 to-orange-400',
            shadow: 'shadow-orange-500/20',
            ring: 'hover:ring-orange-500/20',
        },
        {
            role: 'Client',
            icon: Users,
            desc: 'View projects, invoices and support',
            href: '/login/client',
            gradient: 'from-blue-600 to-blue-400',
            shadow: 'shadow-blue-500/20',
            ring: 'hover:ring-blue-500/20',
        },
    ];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-[Outfit] p-6">
            <div className="text-center mb-16">
                <div className="w-20 h-20 orange-gradient rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-orange-500/20">
                    <span className="text-white font-black text-3xl">W</span>
                </div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase">WEBbuilders</h1>
                <p className="text-slate-400 font-bold mt-3 uppercase tracking-[0.3em] text-[11px]">Strategic Management Portal</p>
            </div>

            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-10">Select Your Portal</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
                {portals.map(({ role, icon: Icon, desc, href, gradient, shadow, ring }) => (
                    <Link
                        key={role}
                        href={href}
                        className={`group bg-white border border-slate-100 rounded-[40px] p-10 flex flex-col items-center gap-6 text-center shadow-sm hover:shadow-xl hover:ring-4 ${ring} transition-all duration-300 hover:-translate-y-1`}
                    >
                        <div className={`w-20 h-20 bg-gradient-to-br ${gradient} rounded-[28px] flex items-center justify-center text-white shadow-2xl ${shadow} group-hover:scale-110 transition-transform duration-300`}>
                            <Icon size={36} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{role}</h2>
                            <p className="text-slate-400 text-sm font-medium mt-2 leading-relaxed">{desc}</p>
                        </div>
                        <span className={`px-8 py-3 bg-gradient-to-r ${gradient} text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg ${shadow} group-hover:scale-105 transition-transform`}>
                            Login as {role}
                        </span>
                    </Link>
                ))}
            </div>

            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] mt-16">
                © 2026 WebBuilders Strategic
            </p>
        </div>
    );
}