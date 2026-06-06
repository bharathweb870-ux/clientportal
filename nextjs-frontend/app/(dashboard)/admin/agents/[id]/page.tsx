'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    ArrowLeft, 
    TrendingUp, 
    Users, 
    CreditCard, 
    CheckCircle2, 
    Clock, 
    AlertCircle,
    Layout,
    ArrowUpRight,
    Loader2,
    Target,
    Percent,
    Banknote
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function AgentManagementPage() {
    const { id } = useParams();
    const router = useRouter();
    const [performance, setPerformance] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

    const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'LKR'>('LKR');
    const [liveRate, setLiveRate] = useState<number>(335);

    const convertAmount = (amount: number) => {
        if (selectedCurrency === 'LKR') return amount;
        return amount / liveRate;
    };

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({
        commission_rate: '',
        target_monthly: '',
        whatsapp: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchPerformance();
        fetchLiveRate();
    }, [id]);

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

    useEffect(() => {
        if (performance) {
            setEditData({
                commission_rate: performance.commission_rate?.toString() || '25',
                target_monthly: performance.target_monthly?.toString() || '0',
                whatsapp: performance.whatsapp || ''
            });
        }
    }, [performance]);

    const fetchPerformance = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/agents/${id}/performance`);
            setPerformance(response.data);
        } catch (error) {
            console.error('Failed to fetch agent performance', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        try {
            setIsSaving(true);
            await api.put(`/agents/${id}`, editData);
            setIsEditModalOpen(false);
            fetchPerformance();
        } catch (error) {
            console.error('Failed to update agent', error);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleCommission = async (commissionId: number, currentStatus: string) => {
        const nextStatus = currentStatus === 'paid' ? 'pending' : 'paid';
        try {
            setUpdatingStatus(commissionId);
            await api.post(`/commissions/${commissionId}/toggle`, { status: nextStatus });
            fetchPerformance();
        } catch (error) {
            console.error('Failed to update commission', error);
        } finally {
            setUpdatingStatus(null);
        }
    };

    if (loading) {
        return (
            <div className="h-[600px] flex flex-col items-center justify-center text-slate-400 gap-4">
                <Loader2 className="animate-spin text-orange-500" size={60} />
                <p className="font-black tracking-widest uppercase text-[10px]">Analyzing Performance Data...</p>
            </div>
        );
    }

    if (!performance) {
        return (
            <div className="p-20 text-center">
                <AlertCircle size={60} className="mx-auto text-red-500 mb-6" />
                <h2 className="text-2xl font-black text-slate-900 uppercase">Agent Not Found</h2>
                <button onClick={() => router.back()} className="mt-8 text-orange-500 font-black uppercase text-xs">Go Back</button>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => router.back()}
                        className="w-16 h-16 bg-white border border-slate-100 rounded-[24px] flex items-center justify-center text-slate-400 hover:text-orange-500 hover:border-orange-500/30 transition-all shadow-sm"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">{performance.agent_name}</h1>
                        <p className="text-slate-500 font-medium text-lg italic">Strategic Agent Management & Performance Tracking</p>
                    </div>
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
                    <button 
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center justify-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-[24px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
                    >
                        Edit Configuration
                    </button>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[48px] p-12 max-w-md w-full shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
                        <div className="text-center">
                            <h2 className="text-3xl font-black text-slate-900 uppercase">Edit Agent Config</h2>
                            <p className="text-slate-500 font-medium mt-2 text-sm italic text-center">Adjust targets and incentive rates for <b>{performance.agent_name}</b></p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Commission Rate (%)</label>
                                <div className="relative">
                                    <input 
                                        type="number"
                                        value={editData.commission_rate}
                                        onChange={(e) => setEditData({...editData, commission_rate: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 px-6 text-slate-900 font-black focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                                    />
                                    <Percent className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Monthly Revenue Target (LKR)</label>
                                <div className="relative">
                                    <input 
                                        type="number"
                                        value={editData.target_monthly}
                                        onChange={(e) => setEditData({...editData, target_monthly: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 px-6 text-slate-900 font-black focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                                    />
                                    <Target className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">WhatsApp Contact</label>
                                <input 
                                    type="text"
                                    value={editData.whatsapp}
                                    onChange={(e) => setEditData({...editData, whatsapp: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 px-6 text-slate-900 font-black focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[24px] font-black uppercase tracking-widest text-xs"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleUpdate}
                                disabled={isSaving}
                                className="flex-1 py-5 orange-gradient text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl shadow-orange-500/20"
                            >
                                {isSaving ? 'Saving...' : 'Update Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Performance KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
                            <Target size={24} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Target</p>
                    </div>
                    <p className="text-2xl font-black text-slate-900">{selectedCurrency} {convertAmount(Number(performance.target_monthly)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                
                <div className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                            <Percent size={24} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commission Rate</p>
                    </div>
                    <p className="text-2xl font-black text-slate-900">{performance.commission_rate}% Direct</p>
                </div>

                <div className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center">
                            <Banknote size={24} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Earned</p>
                    </div>
                    <p className="text-2xl font-black text-green-600">{selectedCurrency} {convertAmount(Number(performance.total_earnings)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>

                <div className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center">
                            <Clock size={24} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Payout</p>
                    </div>
                    <p className="text-2xl font-black text-slate-400">{selectedCurrency} {convertAmount(Number(performance.pending_earnings)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
            </div>

            {/* Client Portfolio */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                        <Users className="text-orange-500" />
                        Client Portfolio
                    </h2>
                </div>

                <div className="bg-white border border-slate-100 rounded-[48px] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Client / Company</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deal Value</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payment Status</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Commissions</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {performance.clients.map((client: any) => (
                                    <tr key={client.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="p-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center font-black group-hover:bg-orange-500 group-hover:text-white transition-all">
                                                    <Layout size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-slate-900 font-black text-lg">{client.name}</p>
                                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{client.company || 'Individual'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <p className="text-slate-900 font-black">{selectedCurrency} {convertAmount(Number(client.total_deal_value)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{client.status}</p>
                                        </td>
                                        <td className="p-8">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                client.payment_status === 'Fully Paid' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                                            }`}>
                                                {client.payment_status}
                                            </span>
                                        </td>
                                        <td className="p-8">
                                            <div className="space-y-2">
                                                {client.commissions.map((comm: any) => (
                                                    <div key={comm.id} className="flex items-center justify-between gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                        <div className="text-[10px] font-black text-slate-900">
                                                            {selectedCurrency} {convertAmount(Number(comm.amount)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                        </div>
                                                        <button 
                                                            disabled={updatingStatus === comm.id}
                                                            onClick={() => toggleCommission(comm.id, comm.status)}
                                                            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                                                comm.status === 'paid' 
                                                                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                                                                    : 'bg-white border border-slate-200 text-slate-400 hover:border-orange-500 hover:text-orange-500'
                                                            }`}
                                                        >
                                                            {updatingStatus === comm.id ? (
                                                                <Loader2 size={12} className="animate-spin" />
                                                            ) : comm.status === 'paid' ? (
                                                                <>Paid <CheckCircle2 size={12} /></>
                                                            ) : (
                                                                <>Mark Paid</>
                                                            )}
                                                        </button>
                                                    </div>
                                                ))}
                                                {client.commissions.length === 0 && (
                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No commission generated</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-8 text-right">
                                            <Link 
                                                href={`/admin/clients/${client.id}`}
                                                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-orange-500 transition-colors"
                                            >
                                                View File <ArrowUpRight size={14} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {performance.clients.length === 0 && (
                        <div className="p-20 text-center space-y-4">
                            <AlertCircle size={48} className="mx-auto text-slate-200" />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">This agent has not registered any clients yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
