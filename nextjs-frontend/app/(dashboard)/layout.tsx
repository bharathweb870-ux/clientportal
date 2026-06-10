'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import TopBar from '@/components/dashboard/TopBar';
import MobileNavbar from '@/components/dashboard/MobileNavbar';
import { Loader2 } from 'lucide-react';

// Get the role-specific token key for the current path
function getTokenKeyForPath(path: string): string {
    if (path.startsWith('/admin')) return 'admin_token';
    if (path.startsWith('/agent')) return 'agent_token';
    return 'client_token';
}

// Get the role-specific login page for the current path
function getLoginPageForPath(path: string): string {
    if (path.startsWith('/admin')) return '/login/admin';
    if (path.startsWith('/agent')) return '/login/agent';
    return '/login/client';
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const tokenKey = getTokenKeyForPath(pathname);
        const token = localStorage.getItem(tokenKey);

        if (!token) {
            // No role-specific token → redirect to role-specific login
            router.push(getLoginPageForPath(pathname));
            return;
        }

        // Token exists for this role → allow access
        setLoading(false);
    }, [pathname]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 orange-gradient rounded-[24px] flex items-center justify-center shadow-2xl shadow-orange-500/20 animate-pulse">
                    <span className="text-white font-black text-2xl">W</span>
                </div>
                <p className="text-slate-400 font-black tracking-widest uppercase text-xs">Verifying Session...</p>
            </div>
        );
    }

    const isClientRoute = pathname.startsWith('/client');

    return (
        <div className="flex min-h-screen bg-white text-slate-900">
            {isClientRoute ? (
                <div className="hidden lg:flex">
                    <Sidebar />
                </div>
            ) : (
                <Sidebar />
            )}
            <div className="flex-1 flex flex-col">
                {isClientRoute ? (
                    <>
                        <div className="hidden lg:block">
                            <TopBar />
                        </div>
                        <MobileNavbar />
                    </>
                ) : (
                    <TopBar />
                )}
                <main className={`flex-1 overflow-y-auto bg-slate-50/50 ${isClientRoute ? 'p-4 sm:p-6 lg:p-10' : 'p-6 lg:p-10'}`}>
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
