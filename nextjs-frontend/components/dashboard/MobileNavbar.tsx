'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingBag,
    Zap,
    Briefcase,
    CreditCard,
    Settings,
    LogOut,
    Menu,
    X,
    User,
    Bell
} from 'lucide-react';
import { clearRoleSession } from '@/lib/auth';
import { resolveApiBaseUrl } from '@/lib/api';

export default function MobileNavbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [userName, setUserName] = useState('User');

    useEffect(() => {
        const tokenKey = 'client_token';
        const token = localStorage.getItem(tokenKey);

        if (!token) {
            router.push('/login/client');
            return;
        }

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
                clearRoleSession('client');
                router.push('/login/client');
                return null;
            }
            return res.json();
        })
        .then(user => {
            if (!user) return;
            if (localStorage.getItem(tokenKey) !== tokenAtStart) return;
            if (user?.name) setUserName(user.name);
        })
        .catch(err => {
            if (err.name === 'AbortError') return;
            setUserName(localStorage.getItem('client_name') || 'User');
        });

        return () => controller.abort();
    }, [pathname, router]);

    const clientMenu = [
        { name: 'Overview', icon: LayoutDashboard, path: '/client' },
        { name: 'Order Website', icon: ShoppingBag, path: '/client/websites' },
        { name: 'My Services', icon: Zap, path: '/client/services' },
        { name: 'My Projects', icon: Briefcase, path: '/client/projects' },
        { name: 'Invoices', icon: CreditCard, path: '/client/invoices' },
        { name: 'Support', icon: Settings, path: '/client/support' },
    ];

    const handleLogout = () => {
        clearRoleSession('client');
        router.push('/login/client');
    };

    return (
        <>
            <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm lg:hidden">
                {/* Left: Brand Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 orange-gradient rounded-lg flex items-center justify-center font-bold text-white shadow-md">W</div>
                    <span className="text-base font-black text-slate-900 tracking-tight uppercase">WEBbuilders</span>
                </Link>

                {/* Right: Actions & Toggle */}
                <div className="flex items-center gap-4">
                    <button className="relative w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-orange-600 transition-all shadow-sm">
                        <Bell size={18} />
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-orange-500 rounded-full border border-white"></span>
                    </button>

                    <button
                        onClick={() => setIsDrawerOpen(true)}
                        className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-orange-600 transition-colors shadow-sm"
                    >
                        <Menu size={20} />
                    </button>
                </div>
            </header>

            {/* Mobile Navigation Drawer */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    {/* Backdrop Overlay with fade-in animation */}
                    <div
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
                        onClick={() => setIsDrawerOpen(false)}
                    />

                    {/* Drawer Content with slide-in animation */}
                    <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white h-full shadow-2xl p-6 transform transition-transform duration-300 animate-in slide-in-from-left duration-300 z-50">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                            <Link href="/" className="flex items-center gap-2" onClick={() => setIsDrawerOpen(false)}>
                                <div className="w-8 h-8 orange-gradient rounded-lg flex items-center justify-center font-bold text-white shadow-md">W</div>
                                <span className="text-base font-black text-slate-900 tracking-tight uppercase">WEBbuilders</span>
                            </Link>
                            <button
                                onClick={() => setIsDrawerOpen(false)}
                                className="w-8 h-8 bg-slate-50 text-slate-400 hover:text-red-500 rounded-lg flex items-center justify-center transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Navigation Links */}
                        <nav className="flex-1 space-y-1.5">
                            {clientMenu.map((item) => {
                                const isActive = pathname === item.path ||
                                    (item.path !== '/client' && pathname.startsWith(item.path));
                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        onClick={() => setIsDrawerOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${
                                            isActive
                                                ? 'bg-orange-50 text-orange-600 shadow-sm'
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-orange-600'
                                        }`}
                                    >
                                        <item.icon size={20} className={isActive ? 'text-orange-600' : 'text-slate-400'} />
                                        <span className="text-sm">{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Profile Info & Logout */}
                        <div className="border-t border-slate-100 pt-6 space-y-4">
                            <div className="flex items-center gap-3 px-2">
                                <div className="w-10 h-10 orange-gradient rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-orange-500/10">
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-900">{userName}</p>
                                    <p className="text-[9px] text-orange-500 font-bold uppercase tracking-widest">Premium Account</p>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setIsDrawerOpen(false);
                                    handleLogout();
                                }}
                                className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all font-semibold"
                            >
                                <LogOut size={20} />
                                <span className="text-sm">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
