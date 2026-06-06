'use client';

import { Bell, Search, User, LogOut, ChevronDown } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { resolveApiBaseUrl } from '@/lib/api';
import { clearRoleSession, type UserRole } from '@/lib/auth';

// Get the role-specific token key based on current URL path
function getTokenKey(path: string): string {
    if (path.startsWith('/admin')) return 'admin_token';
    if (path.startsWith('/agent')) return 'agent_token';
    return 'client_token';
}

function getLoginPage(path: string): string {
    if (path.startsWith('/admin')) return '/login/admin';
    if (path.startsWith('/agent')) return '/login/agent';
    return '/login/client';
}

export default function TopBar() {
    const pathname = usePathname();
    const router = useRouter();
    const [userName, setUserName] = useState('User');
    const [userRole, setUserRole] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const tokenKey = getTokenKey(pathname);
        const token = localStorage.getItem(tokenKey);

        if (!token) {
            router.push(getLoginPage(pathname));
            return;
        }

        // Snapshot token to detect account switch mid-flight
        const tokenAtStart = token;
        const controller = new AbortController();

        fetch(`${resolveApiBaseUrl()}/user`, {
            signal: controller.signal,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        })
        .then(res => {
            if (res.status === 401) {
                clearRoleSession(tokenKey.replace('_token', '') as UserRole);
                router.push(getLoginPage(pathname));
                return null;
            }
            return res.json();
        })
        .then(user => {
            if (!user) return;
            // Discard stale response if token was replaced (account switch)
            if (localStorage.getItem(tokenKey) !== tokenAtStart) return;
            if (user?.name) setUserName(user.name);
            if (user?.role) setUserRole(user.role);
        })
        .catch(err => {
            if (err.name === 'AbortError') return;
            // Fallback: use cached name
            const role = tokenKey.replace('_token', '') as UserRole;
            setUserName(localStorage.getItem(`${role}_name`) || 'User');
            setUserRole(role);
        });

        return () => controller.abort();
    }, [pathname, router]);

    const handleLogout = () => {
        const tokenKey = getTokenKey(pathname);
        const role = tokenKey.replace('_token', '') as UserRole;
        // Clear ONLY this role's session — other roles remain intact
        clearRoleSession(role);
        router.push(getLoginPage(pathname));
    };

    const roleSub = userRole === 'admin' ? 'Super Admin'
        : userRole === 'agent' ? 'Strategic Agent'
        : userRole === 'client' ? 'Premium Account'
        : 'Portal Access';

    return (
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-50 shadow-sm">
            {/* Search */}
            <div className="relative w-96 hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search clients, invoices, or projects..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6">
                <button className="relative w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-orange-600 transition-all shadow-sm">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="h-10 w-[1px] bg-slate-100 mx-2"></div>

                {/* User Dropdown */}
                <div className="relative">
                    <div
                        className="flex items-center gap-4 group cursor-pointer"
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-black text-slate-900">{userName}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{roleSub}</p>
                        </div>
                        <div className="w-12 h-12 orange-gradient rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-all">
                            <User size={24} />
                        </div>
                        <ChevronDown className={`text-slate-400 group-hover:text-orange-600 transition-all ${showDropdown ? 'rotate-180' : ''}`} size={16} />
                    </div>

                    {showDropdown && (
                        <div className="absolute right-0 top-16 w-56 bg-white border border-slate-100 rounded-3xl shadow-2xl shadow-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-4 border-b border-slate-50">
                                <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{userName}</p>
                                <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mt-0.5">{roleSub}</p>
                            </div>
                            <div className="p-2">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest"
                                >
                                    <LogOut size={16} />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
