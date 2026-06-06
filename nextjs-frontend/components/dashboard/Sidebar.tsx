'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Briefcase,
    CreditCard,
    Calendar,
    LogOut,
    UserCircle,
    Settings,
    Shield,
    Zap,
    ShoppingBag
} from 'lucide-react';
import { clearRoleSession, type UserRole } from '@/lib/auth';

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

export default function Sidebar() {
    const pathname = usePathname();
    const isClient = pathname.startsWith('/client');
    const isAdmin = pathname.startsWith('/admin');

    const agentMenu = [
        { name: 'Overview', icon: LayoutDashboard, path: '/agent' },
        { name: 'New Client', icon: UserCircle, path: '/agent/clients/new' },
        { name: 'My Clients', icon: Users, path: '/agent/clients' },
        { name: 'Commissions', icon: CreditCard, path: '/agent/commissions' },
    ];

    const adminMenu = [
        { name: 'Overview', icon: LayoutDashboard, path: '/admin' },
        { name: 'Clients', icon: Users, path: '/admin/clients' },
        { name: 'Agents', icon: UserCircle, path: '/admin/agents' },
        { name: 'Projects', icon: Briefcase, path: '/admin/projects' },
        { name: 'Payments', icon: CreditCard, path: '/admin/payments' },
        { name: 'Calendar', icon: Calendar, path: '/admin/calendar' },
        { name: 'Security', icon: Shield, path: '/admin/activity-logs' },
        { name: 'Settings', icon: Settings, path: '/admin/settings' },
    ];

    const clientMenu = [
        { name: 'Overview', icon: LayoutDashboard, path: '/client' },
        { name: 'Order Website', icon: ShoppingBag, path: '/client/websites' },
        { name: 'My Services', icon: Zap, path: '/client/services' },
        { name: 'My Projects', icon: Briefcase, path: '/client/projects' },
        { name: 'Invoices', icon: CreditCard, path: '/client/invoices' },
        { name: 'Support', icon: Settings, path: '/client/support' },
    ];

    const menuItems = isAdmin ? adminMenu : (isClient ? clientMenu : agentMenu);

    const handleLogout = () => {
        const tokenKey = getTokenKey(pathname);
        const role = tokenKey.replace('_token', '') as UserRole;
        // Clear ONLY this role's session — other logged-in users remain unaffected
        clearRoleSession(role);
        window.location.href = getLoginPage(pathname);
    };

    return (
        <aside className="w-64 bg-white border-r border-slate-100 flex flex-col h-screen sticky top-0 shadow-sm">
            <div className="p-6">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 orange-gradient rounded-lg flex items-center justify-center font-bold text-white shadow-md">W</div>
                    <span className="text-xl font-black text-slate-900 tracking-tight uppercase">WEBbuilders</span>
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-4">
                {menuItems.map((item) => {
                    // Exact match for root paths, startsWith for nested paths
                    const isActive = pathname === item.path ||
                        (item.path !== '/admin' && item.path !== '/agent' && item.path !== '/client' &&
                            pathname.startsWith(item.path));
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
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

            <div className="p-4 border-t border-slate-50">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all font-semibold"
                >
                    <LogOut size={20} />
                    <span className="text-sm">Logout</span>
                </button>
            </div>
        </aside>
    );
}
