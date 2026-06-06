'use client';

import { useState, useEffect } from 'react';
import { 
    TrendingUp, 
    Users, 
    CreditCard, 
    CheckCircle2, 
    Clock, 
    AlertCircle,
    Layout,
    ArrowUpRight,
    Loader2,
    Percent,
    Banknote,
    History
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function AgentMyCommissionsPage() {
    const [performance, setPerformance] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'LKR'>('LKR');
    const [liveRate, setLiveRate] = useState<number>(335);

    const convertAmount = (amount: number) => {
        if (selectedCurrency === 'LKR') return amount;
        return amount / liveRate;
    };

    useEffect(() => {
        fetchPerformance();
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

    const fetchPerformance = async () => {
        try {
            setLoading(true);
            const response = await api.get('/agent/my-performance');
            setPerformance(response.data);
        } catch (error) {
            console.error('Failed to fetch performance', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[600px] flex flex-col items-center justify-center text-slate-400 gap-4">
                <Loader2 className="animate-spin text-orange-500" size={60} />
                <p className="font-black tracking-widest uppercase text-[10px]">Fetching Your Earnings...</p>
            </div>
        );
    }

    if (!performance) {
        return (
            <div className="p-20 text-center">
                <AlertCircle size={60} className="mx-auto text-red-500 mb-6" />
                <h2 className="text-2xl font-black text-slate-900 uppercase">Account Error</h2>
                <p className="text-slate-500 mt-2 font-medium">We couldn't retrieve your commission data. Please contact Admin.</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase">My Commissions</h1>
                    <p className="text-slate-500 mt-2 font-medium text-lg italic tracking-wide">Track your personal revenue and referral earnings.</p>
                </div>
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
            </div>

            {/* Performance KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white border border-slate-100 p-10 rounded-[48px] shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 opacity-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="flex items-center gap-6 mb-6 z-10 relative">
                        <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                            <Percent size={28} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Commission Tier</p>
                    </div>
                    <p className="text-4xl font-black text-slate-900 z-10 relative">{performance.commission_rate}% Direct</p>
                </div>

                <div className="bg-white border border-slate-100 p-10 rounded-[48px] shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 opacity-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="flex items-center gap-6 mb-6 z-10 relative">
                        <div className="w-14 h-14 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center">
                            <Banknote size={28} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Earned</p>
                    </div>
                    <p className="text-4xl font-black text-green-600 z-10 relative">{selectedCurrency} {convertAmount(Number(performance.total_earnings)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
 
                <div className="bg-white border border-slate-100 p-10 rounded-[48px] shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 opacity-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="flex items-center gap-6 mb-6 z-10 relative">
                        <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
                            <Clock size={28} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pending Payout</p>
                    </div>
                    <p className="text-4xl font-black text-orange-600 z-10 relative">{selectedCurrency} {convertAmount(Number(performance.pending_earnings)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
            </div>

            {/* My Client Pipeline */}
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                        <History size={24} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Referral Pipeline</h2>
                </div>

                <div className="bg-white border border-slate-100 rounded-[64px] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="p-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Referred Client</th>
                                    <th className="p-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deal Value</th>
                                    <th className="p-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Your Commission</th>
                                    <th className="p-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payout Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {performance.clients.map((client: any) => (
                                    <tr key={client.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="p-10">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center font-black group-hover:bg-orange-500 group-hover:text-white transition-all shadow-sm">
                                                    <Layout size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-slate-900 font-black text-xl">{client.name}</p>
                                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{client.company || 'Direct Entry'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-10">
                                            <p className="text-slate-900 font-black text-lg font-mono">{selectedCurrency} {convertAmount(Number(client.total_deal_value)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Status: {client.status}</p>
                                        </td>
                                        <td className="p-10">
                                            <div className="space-y-3">
                                                {client.commissions.map((comm: any) => (
                                                    <div key={comm.id} className="flex items-center gap-3">
                                                        <span className="text-lg font-black text-slate-900 font-mono">{selectedCurrency} {convertAmount(Number(comm.amount)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                                        <span className="text-[9px] font-black bg-orange-50 text-orange-600 px-2 py-0.5 rounded uppercase tracking-widest">({comm.percentage}%)</span>
                                                    </div>
                                                ))}
                                                {client.commissions.length === 0 && (
                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic italic">Pending Verification</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-10">
                                            <div className="space-y-2">
                                                {client.commissions.map((comm: any) => (
                                                    <div key={comm.id} className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                                        comm.status === 'paid' 
                                                            ? 'bg-green-50 text-green-600 border border-green-100' 
                                                            : 'bg-orange-50 text-orange-600 border border-orange-100'
                                                    }`}>
                                                        {comm.status === 'paid' ? (
                                                            <><CheckCircle2 size={14} /> Dispatched</>
                                                        ) : (
                                                            <><Clock size={14} /> Processing</>
                                                        )}
                                                    </div>
                                                ))}
                                                {client.commissions.length === 0 && (
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Awaiting Approval</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {performance.clients.length === 0 && (
                        <div className="p-24 text-center space-y-6">
                            <AlertCircle size={64} className="mx-auto text-slate-100" />
                            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-sm">Your referral pipeline is currently empty.</p>
                            <Link href="/agent/clients/new" className="inline-block orange-gradient text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-orange-500/20 hover:scale-105 transition-all">
                                Register Your First Lead
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}