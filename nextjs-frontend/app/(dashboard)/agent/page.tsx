'use client';

import { useState, useEffect } from 'react';
import { 
    Users, 
    DollarSign, 
    TrendingUp, 
    Clock, 
    Plus,
    ChevronRight,
    ArrowUpRight,
    Loader2,
    Shield
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
    ResponsiveContainer 
} from 'recharts';
import api from '@/lib/api';

export default function AgentDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthMissing, setIsAuthMissing] = useState(false);

    const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'LKR'>('LKR');
    const [liveRate, setLiveRate] = useState<number>(335);

    const convertAmount = (amount: number) => {
        if (selectedCurrency === 'LKR') return amount;
        return amount / liveRate;
    };

    useEffect(() => {
        fetchAgentDashboard();
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

    const fetchAgentDashboard = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('agent_token') : null;
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
            console.error('Failed to fetch agent dashboard:', error instanceof Error ? error.message : 'Unknown error');
            if (error.response?.status === 401) {
                setIsAuthMissing(true);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[600px] flex flex-col items-center justify-center text-slate-400 gap-4">
                <Loader2 className="animate-spin text-orange-500" size={60} />
                <p className="font-bold tracking-widest uppercase text-xs">Syncing Performance Data...</p>
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
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Agent Access Required</h2>
                    <p className="text-slate-500 text-lg max-w-md mx-auto leading-relaxed font-medium">
                        Secure connection required to access your strategic workspace.
                    </p>
                    <button 
                        onClick={fetchAgentDashboard}
                        className="mt-6 px-12 py-5 orange-gradient text-white rounded-2xl font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-orange-500/30"
                    >
                        Secure Access
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight">Agent Workspace</h1>
                    <p className="text-slate-500 mt-3 text-lg font-medium">Track your clients, projects, and personal earnings.</p>
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
                    <Link 
                        href="/agent/clients/new"
                        className="flex items-center gap-3 orange-gradient text-white px-10 py-5 rounded-[24px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-orange-500/30"
                    >
                        <Plus size={20} />
                        New Client
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard 
                    title="Total Earnings" 
                    value={`${selectedCurrency} ${convertAmount(stats?.total_earnings || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} 
                    icon={DollarSign}
                    trend={{ value: "+0%", positive: true }}
                />
                <StatCard 
                    title="Pending Payouts" 
                    value={`${selectedCurrency} ${convertAmount(stats?.pending_payouts || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} 
                    icon={Clock}
                />
                <StatCard 
                    title="Your Clients" 
                    value={String(stats?.total_clients || 0)} 
                    icon={Users}
                />
                <StatCard 
                    title="Commission Rate" 
                    value={stats?.commission_rate || '25%'} 
                    icon={TrendingUp}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Analytics Chart */}
                <div className="lg:col-span-2 bg-white border border-slate-100 p-10 rounded-[48px] shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Earnings Curve</h2>
                            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Performance Overview</p>
                        </div>
                    </div>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.monthly_earnings || []}>
                                <defs>
                                    <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ff6b00" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#ff6b00" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} dy={15} fontSize={12} fontWeight={700} />
                                <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} fontSize={12} fontWeight={700} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Area type="monotone" dataKey="commission" stroke="#ff6b00" strokeWidth={5} fillOpacity={1} fill="url(#colorComm)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Activity / Clients */}
                <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm flex flex-col">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-10 uppercase text-center">Recent Network</h2>
                    <div className="space-y-6 flex-1">
                        {stats?.recent_clients?.length > 0 ? stats.recent_clients.map((item: any, i: number) => (
                            <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-5 rounded-[28px] transition-all border border-transparent hover:border-orange-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 orange-gradient rounded-2xl flex items-center justify-center font-black text-white shadow-xl shadow-orange-500/20 group-hover:scale-110 transition-transform">
                                        {item.full_name[0]}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900">{item.full_name}</p>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{item.company_name || 'Personal Client'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(item.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="py-20 text-center flex flex-col items-center gap-4">
                                <Users size={48} className="text-slate-200" />
                                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No recent client activity.</p>
                            </div>
                        )}
                    </div>
                    <Link 
                        href="/agent/clients"
                        className="w-full mt-10 py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-900/20"
                    >
                        View All Clients
                        <ChevronRight size={20} />
                    </Link>
                </div>
            </div>
        </div>
    );
}