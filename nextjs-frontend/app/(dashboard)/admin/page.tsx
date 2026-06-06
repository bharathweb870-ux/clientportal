'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
    Users, 
    Briefcase, 
    DollarSign, 
    TrendingUp, 
    Clock, 
    AlertCircle, 
    FileText,
    PieChart,
    ArrowUpRight,
    Loader2,
    Shield,
    ShoppingBag
} from 'lucide-react';
import Link from 'next/link';
import StatCard from '@/components/dashboard/StatCard';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import api from '@/lib/api';

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthMissing, setIsAuthMissing] = useState(false);
    const [pendingWebsiteOrders, setPendingWebsiteOrders] = useState<number | null>(null);
    const [ledgerRows, setLedgerRows] = useState<any[]>([]);
    const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'LKR'>('USD');
    const [liveRate, setLiveRate] = useState<number>(335);

    const exchangeRate = liveRate;

    useEffect(() => {
        fetchDashboardStats();
        fetchPendingWebsiteOrders();
        fetchLedgerRows();
        fetchLiveRate();
    }, []);

    const fetchLiveRate = async () => {
        try {
            const res = await api.get('/exchange-rate');
            if (res.data?.rate && res.data.rate > 1) {
                setLiveRate(Number(res.data.rate));
            }
        } catch {
            // Keep fallback
        }
    };

    const fetchPendingWebsiteOrders = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        if (!token) {
            return;
        }

        try {
            const response = await api.get('/projects');
            const projects = Array.isArray(response.data) ? response.data : [];
            const count = projects.filter((project: any) => {
                const name = String(project?.name || '').toLowerCase();
                if (!name.startsWith('website order -')) return false;

                const approvalStatus = String(project?.approval_status || '').toLowerCase();
                const status = String(project?.status || '').toLowerCase();

                if (approvalStatus === 'approved') return false;
                return approvalStatus === 'pending' || status === 'pending' || !['cancelled', 'completed', 'approved'].includes(status);
            }).length;

            setPendingWebsiteOrders(count);
        } catch (error) {
            console.error('Failed to fetch website order count:', error instanceof Error ? error.message : 'Unknown error');
        }
    };

    const fetchDashboardStats = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        if (!token) {
            setIsAuthMissing(true);
            setLoading(false);
            return;
        }

        try {
            setIsAuthMissing(false);
            const response = await api.get('/dashboard');
            setStats(response.data);
        } catch (error: any) {
            console.error('Failed to fetch dashboard stats:', error instanceof Error ? error.message : 'Unknown error');
            if (error.response?.status === 401) {
                setIsAuthMissing(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchLedgerRows = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        if (!token) {
            return;
        }

        try {
            const response = await api.get('/payments');
            setLedgerRows(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Failed to fetch payment ledger rows:', error instanceof Error ? error.message : 'Unknown error');
        }
    };

    const websiteOrderCount = pendingWebsiteOrders ?? (stats?.website_orders_count || 0);

    const convertAmount = (amount: number, fromCurrency: string, toCurrency: string) => {
        const from = String(fromCurrency || 'USD').toUpperCase();
        const to = String(toCurrency || 'USD').toUpperCase();

        if (from === to) return amount;
        if (from === 'USD' && to === 'LKR') return amount * exchangeRate;
        if (from === 'LKR' && to === 'USD') return amount / exchangeRate;
        return amount;
    };

    const formatCurrencyAmount = (amount: number) => {
        return `${selectedCurrency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    };

    const summarizeBreakdown = (breakdown: Record<string, number> | undefined) => {
        if (!breakdown || typeof breakdown !== 'object') return formatCurrencyAmount(0);

        const total = Object.entries(breakdown).reduce((sum, [currency, amount]) => {
            return sum + convertAmount(Number(amount) || 0, currency, selectedCurrency);
        }, 0);

        return formatCurrencyAmount(total);
    };

    const paymentSummary = useMemo(() => {
        if (ledgerRows.length > 0) {
            let revenue = 0;
            let processing = 0;
            let failedCount = 0;

            ledgerRows.forEach((txn: any) => {
                const currency = String(txn?.currency || txn?.invoice?.currency || 'USD').toUpperCase();
                const amount = Number(txn?.amount || 0);
                const status = String(txn?.status || '').toLowerCase();

                const convertedAmount = convertAmount(amount, currency, selectedCurrency);
                if (status === 'paid') {
                    revenue += convertedAmount;
                }

                if (status === 'pending') {
                    processing += convertedAmount;
                }

                if (status === 'failed') {
                    failedCount += 1;
                }
            });

            return {
                revenue: formatCurrencyAmount(revenue),
                processing: formatCurrencyAmount(processing),
                issues: `${failedCount} issues`,
                commissions: formatCurrencyAmount(convertAmount(Number(stats?.total_commissions || 0), 'USD', selectedCurrency)),
            };
        }

        return {
            revenue: summarizeBreakdown(stats?.total_revenue_breakdown),
            processing: summarizeBreakdown(stats?.pending_payments_breakdown),
            issues: `${stats?.transaction_issues || 0} issues`,
            commissions: formatCurrencyAmount(convertAmount(Number(stats?.total_commissions || 0), 'USD', selectedCurrency)),
        };
    }, [ledgerRows, selectedCurrency, stats, formatCurrencyAmount, summarizeBreakdown]);

    if (loading) {
        return (
            <div className="h-[600px] flex flex-col items-center justify-center text-slate-400 gap-4">
                <Loader2 className="animate-spin text-orange-500" size={60} />
                <p className="font-bold tracking-widest uppercase text-xs">Synchronizing Agency Data...</p>
            </div>
        );
    }

    if (isAuthMissing) {
        return (
            <div className="h-[600px] flex flex-col items-center justify-center text-center space-y-8 bg-white rounded-[48px] border border-slate-100 shadow-sm">
                <div className="w-24 h-24 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-500 border border-orange-100 shadow-xl shadow-orange-500/10 animate-pulse">
                    <Shield size={48} />
                </div>
                <div className="space-y-3 px-6">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Executive Access Required</h2>
                    <p className="text-slate-500 text-lg max-w-md mx-auto leading-relaxed font-medium">
                        Secure connection required to view agency performance metrics.
                    </p>
                    <button 
                        onClick={fetchDashboardStats}
                        className="mt-6 px-12 py-5 orange-gradient text-white rounded-2xl font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-orange-500/30"
                    >
                        Authenticate Connection
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight">Executive Overview</h1>
                    <p className="text-slate-500 mt-3 text-lg font-medium">Manage your agency performance, revenue, and client growth.</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="bg-white border border-slate-100 rounded-[24px] p-2 shadow-sm flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectedCurrency('USD')}
                            className={`px-5 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                                selectedCurrency === 'USD' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-400 hover:text-slate-900'
                            }`}
                        >
                            USD
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedCurrency('LKR')}
                            className={`px-5 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                                selectedCurrency === 'LKR' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-400 hover:text-slate-900'
                            }`}
                        >
                            LKR
                        </button>
                    </div>
                    <div className="bg-white border border-slate-100 px-8 py-4 rounded-[24px] flex items-center gap-4 shadow-sm">
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Performance Sync</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard 
                    title="Total Revenue" 
                    value={paymentSummary.revenue} 
                    icon={DollarSign}
                    trend={{ value: stats?.revenue_trend || "+0%", positive: true }}
                />
                <StatCard 
                    title="Active Projects" 
                    value={stats?.active_projects || "0"} 
                    icon={Briefcase}
                    trend={{ value: stats?.projects_trend || "0 Running", positive: true }}
                />
                <StatCard 
                    title="Agent Commissions" 
                    value={paymentSummary.commissions} 
                    icon={PieChart}
                    trend={{ value: "Pool Total", positive: true }}
                />
                <StatCard 
                    title="Pending Payments" 
                    value={paymentSummary.processing} 
                    icon={Clock}
                    trend={{ value: stats?.payments_trend || "0 Overdue", positive: false }}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white border border-slate-100 p-10 rounded-[48px] shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Financial Velocity</h2>
                            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Monthly Revenue Trends</p>
                        </div>
                    </div>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.monthly_revenue || []}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ff6b00" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#ff6b00" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} dy={15} fontSize={12} fontWeight={700} />
                                <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} tickFormatter={(value) => `${value/1000}k`} fontSize={12} fontWeight={700} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#ff6b00" strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Service Distribution */}
                <div className="bg-white border border-slate-100 p-10 rounded-[48px] shadow-sm">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-10 text-center uppercase">Asset Distribution</h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.service_breakdown || []}>
                                <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} fontSize={10} fontWeight={800} />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar dataKey="count" fill="#ff6b00" radius={[12, 12, 12, 12]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-10 space-y-5">
                        {(stats?.service_breakdown || []).map((s: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-orange-200 transition-all group">
                                <span className="text-slate-500 text-xs font-black uppercase tracking-widest">{s.name}</span>
                                <span className="text-slate-900 font-black group-hover:text-orange-600 transition-colors">{s.count} Assets</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Critical Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="bg-blue-50 border border-blue-100 p-10 rounded-[48px] flex items-center gap-8 group hover:bg-blue-100/50 transition-all shadow-sm">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-blue-500 shadow-xl shadow-blue-500/10">
                        <ShoppingBag size={40} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Website Orders</h3>
                        <p className="text-blue-600/70 font-bold text-sm mt-1 uppercase tracking-widest leading-relaxed">{websiteOrderCount} client purchases pending</p>
                        <Link 
                            href="/admin/projects" 
                            className="mt-4 text-slate-900 font-black flex items-center gap-2 group-hover:gap-4 transition-all text-[10px] uppercase tracking-[0.2em]"
                        >
                            View Orders <ArrowUpRight size={18} className="text-blue-500" />
                        </Link>
                    </div>
                </div>

                <div className="bg-red-50 border border-red-100 p-10 rounded-[48px] flex items-center gap-8 group hover:bg-red-100/50 transition-all shadow-sm">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-red-500 shadow-xl shadow-red-500/10">
                        <AlertCircle size={40} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Service Expirations</h3>
                        <p className="text-red-600/70 font-bold text-sm mt-1 uppercase tracking-widest leading-relaxed">Action required: {stats?.expired_services_count || 0} renewals pending</p>
                        <Link 
                            href="/admin/calendar" 
                            className="mt-4 text-slate-900 font-black flex items-center gap-2 group-hover:gap-4 transition-all text-[10px] uppercase tracking-[0.2em]"
                        >
                            Manage Renewals <ArrowUpRight size={18} className="text-red-500" />
                        </Link>
                    </div>
                </div>

                <div className="bg-orange-50 border border-orange-100 p-10 rounded-[48px] flex items-center gap-8 group hover:bg-orange-100/50 transition-all shadow-sm">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-orange-500 shadow-xl shadow-orange-500/10">
                        <TrendingUp size={40} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Onboarding Requests</h3>
                        <p className="text-orange-600/70 font-bold text-sm mt-1 uppercase tracking-widest leading-relaxed">{stats?.new_requests_count || 0} new registrations today</p>
                        <a href="/admin/clients?status=pending" className="mt-4 text-slate-900 font-black flex items-center gap-2 group-hover:gap-4 transition-all text-[10px] uppercase tracking-[0.2em]">
                            Approve Access <ArrowUpRight size={18} className="text-orange-500" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
