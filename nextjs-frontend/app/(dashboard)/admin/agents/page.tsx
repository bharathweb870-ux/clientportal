'use client';

import { useState, useEffect } from 'react';
import { 
    Users,
    Search, 
    Plus, 
    Filter, 
    MoreHorizontal,
    Mail,
    Phone,
    Trophy,
    TrendingUp,
    CreditCard,
    Loader2,
    Shield,
    AlertCircle,
    ArrowUpRight,
    Calendar
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function AgentsPage() {
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAuthMissing, setIsAuthMissing] = useState(false);

    const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'LKR'>('LKR');
    const [liveRate, setLiveRate] = useState<number>(335);

    const convertAmount = (amount: number) => {
        if (selectedCurrency === 'LKR') return amount;
        return amount / liveRate;
    };

    useEffect(() => {
        fetchAgents();
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

    const fetchAgents = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        if (!token) {
            setIsAuthMissing(true);
            setLoading(false);
            return;
        }

        try {
            setIsAuthMissing(false);
            const response = await api.get('/agents');
            setAgents(response.data);
        } catch (error: any) {
            console.error('Failed to fetch agents', error);
            if (error.response?.status === 401) {
                setIsAuthMissing(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredAgents = agents.filter(agent => 
        (agent.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agent.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalCommissionPool = agents.reduce((acc, a) => acc + Number(a.earned_commissions || 0) + Number(a.pending_commissions || 0), 0);

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase">Agent Hub</h1>
                    <p className="text-slate-500 mt-2 font-medium text-lg italic">Monitor agent performance and commission payouts.</p>
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
                        href="/admin/agents/new"
                        className="flex items-center justify-center gap-3 orange-gradient text-white px-10 py-5 rounded-[24px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-orange-500/30"
                    >
                        <Plus size={20} />
                        Add New Agent
                    </Link>
                </div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm flex items-center gap-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 opacity-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="w-16 h-16 bg-slate-50 text-orange-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-orange-600 group-hover:text-white transition-all duration-500 z-10">
                        <Trophy size={32} />
                    </div>
                    <div className="z-10">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Network</p>
                        <p className="text-3xl font-black text-slate-900">{agents.length} Agents</p>
                    </div>
                </div>
                <div className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm flex items-center gap-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 opacity-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="w-16 h-16 bg-slate-50 text-green-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-green-600 group-hover:text-white transition-all duration-500 z-10">
                        <TrendingUp size={32} />
                    </div>
                    <div className="z-10">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Growth Status</p>
                        <p className="text-3xl font-black text-slate-900">Active</p>
                    </div>
                </div>
                <div className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm flex items-center gap-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 opacity-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="w-16 h-16 bg-slate-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 z-10">
                        <CreditCard size={32} />
                    </div>
                    <div className="z-10">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Commission Pool</p>
                        <p className="text-3xl font-black text-slate-900">
                            {selectedCurrency} {convertAmount(totalCommissionPool).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm">
                <div className="relative max-w-md group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search agents..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 pl-16 pr-8 text-sm text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Agents Table */}
            <div className="bg-white border border-slate-100 rounded-[48px] overflow-hidden shadow-sm min-h-[400px] flex flex-col">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
                        <Loader2 className="animate-spin text-orange-500" size={60} />
                        <p className="font-black tracking-widest uppercase text-[10px]">Loading Network...</p>
                    </div>
                ) : isAuthMissing ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 p-20">
                        <div className="w-24 h-24 bg-orange-50 rounded-[32px] flex items-center justify-center text-orange-500 border border-orange-100 shadow-xl shadow-orange-500/10">
                            <Shield size={48} />
                        </div>
                        <div className="space-y-2">
                            <p className="text-slate-900 font-black text-2xl uppercase tracking-tighter">Auth Required</p>
                            <p className="text-slate-500 text-sm max-w-xs mx-auto font-medium">Please authenticate to view the agent network.</p>
                            <button 
                                onClick={fetchAgents}
                                className="mt-8 px-10 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/20"
                            >
                                Retry Connection
                            </button>
                        </div>
                    </div>
                ) : filteredAgents.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Strategic Agent</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Account Handles</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Commissions</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deployment</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredAgents.map((agent) => (
                                    <tr key={agent.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="p-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-16 h-16 orange-gradient rounded-[24px] flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-orange-500/20 group-hover:scale-110 transition-transform">
                                                    {(agent.name || 'A')[0]}
                                                </div>
                                                <div>
                                                    <p className="text-slate-900 font-black text-lg">{agent.name}</p>
                                                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
                                                        <Mail size={12} className="text-orange-500" />
                                                        {agent.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <div className="space-y-1">
                                                <p className="text-slate-900 font-black">@{agent.username || 'n/a'}</p>
                                                <p className="text-[10px] uppercase tracking-widest font-black text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md inline-block">Tier: {agent.role}</p>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-slate-900 font-black text-sm">
                                                    <TrendingUp size={12} className="text-green-500" />
                                                    {agent.commission_rate || 25}%
                                                </div>
                                                <div className="flex flex-col gap-1.5 mt-3">
                                                    <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-xl">
                                                        <span className="text-[9px] font-black text-green-600 uppercase tracking-widest mr-4">Earned</span>
                                                        <span className="text-[11px] font-black text-green-700 font-mono">{selectedCurrency} {convertAmount(Number(agent.earned_commissions || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-4">Pending</span>
                                                        <span className="text-[11px] font-black text-slate-600 font-mono">{selectedCurrency} {convertAmount(Number(agent.pending_commissions || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                                                <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                                    <Calendar size={14} />
                                                </div>
                                                {agent.created_at ? new Date(agent.created_at).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="p-8 text-right">
                                            <div className="flex justify-end gap-3">
                                                <button 
                                                    onClick={() => {
                                                        if(confirm(`Are you sure you want to delete agent ${agent.name}?`)) {
                                                            api.delete(`/agents/${agent.id}`).then(() => fetchAgents());
                                                        }
                                                    }}
                                                    className="w-12 h-12 flex items-center justify-center bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-[18px] transition-all shadow-sm"
                                                    title="Terminate Access"
                                                >
                                                    <AlertCircle size={20} />
                                                </button>
                                                <Link 
                                                    href={`/admin/agents/${agent.id}`}
                                                    className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2"
                                                >
                                                    Manage <ArrowUpRight size={14} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center gap-6">
                        <Users size={60} className="text-slate-100" />
                        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">No active agents in the hub.</p>
                    </div>
                )}
            </div>
        </div>
    );
}