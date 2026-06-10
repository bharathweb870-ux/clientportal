'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Mail, Phone, Building2, Layout, CreditCard, Loader2, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function AgentClientDetailPage() {
    const [id, setId] = useState<string | null>(null);
    const router = useRouter();
    const [client, setClient] = useState<any>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const queryId = params.get('id');
            if (queryId) {
                setId(queryId);
            } else {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        if (id) {
            Promise.all([
                api.get('/clients').then(r => {
                    const found = (r.data as any[]).find((c: any) => String(c.id) === String(id));
                    if (!found) router.push('/agent/clients');
                    setClient(found);
                }),
                api.get('/projects').then(r => setProjects((r.data as any[]).filter((p: any) => String(p.client_id) === String(id)))),
                api.get('/invoices').then(r => setInvoices(r.data as any[])),
            ]).finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) return (
        <div className="h-[60vh] flex items-center justify-center">
            <Loader2 className="animate-spin text-orange-500" size={60} />
        </div>
    );

    if (!client) return null;

    const statusColor = (s: string) =>
        ['completed'].includes(s?.toLowerCase()) ? 'bg-green-50 text-green-600' :
        ['in progress'].includes(s?.toLowerCase()) ? 'bg-blue-50 text-blue-600' :
        ['on hold'].includes(s?.toLowerCase()) ? 'bg-yellow-50 text-yellow-600' :
        'bg-orange-50 text-orange-600';

    return (
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-10 animate-in fade-in duration-700 pb-20 px-2 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/agent/clients" className="w-10 h-10 sm:w-14 sm:h-14 bg-white border border-slate-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-400 hover:text-orange-600 transition-all shadow-sm shrink-0">
                        <ChevronLeft size={20} className="sm:size-[28px]" />
                    </Link>
                    <div>
                        <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight uppercase leading-tight">{client.full_name}</h1>
                        <p className="text-slate-400 text-xs sm:text-sm font-bold mt-1 truncate max-w-[280px] sm:max-w-none">{client.company_name || 'Individual Account'} &bull; {client.email}</p>
                    </div>
                </div>
                <span className={`sm:ml-auto px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-center self-start sm:self-auto ${client.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                    {client.status || 'active'}
                </span>
            </div>

            {/* Contact Info */}
            <div className="bg-white border border-slate-100 rounded-[20px] sm:rounded-[40px] p-6 sm:p-10 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-400 shrink-0"><Mail size={18} className="sm:size-[20px]" /></div>
                    <div className="min-w-0">
                        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                        <p className="font-black text-slate-900 text-xs sm:text-sm truncate">{client.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-400 shrink-0"><Phone size={18} className="sm:size-[20px]" /></div>
                    <div className="min-w-0">
                        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</p>
                        <p className="font-black text-slate-900 text-xs sm:text-sm truncate">{client.phone || client.whatsapp || 'N/A'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-400 shrink-0"><Building2 size={18} className="sm:size-[20px]" /></div>
                    <div className="min-w-0">
                        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Company</p>
                        <p className="font-black text-slate-900 text-xs sm:text-sm truncate">{client.company_name || 'Individual'}</p>
                    </div>
                </div>
            </div>

            {/* Projects */}
            <div className="space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 sm:gap-3">
                    <Layout size={20} className="text-orange-500 sm:size-[22px]" /> Projects
                </h2>
                {projects.length > 0 ? projects.map((p: any) => (
                    <div key={p.id} className="bg-white border border-slate-100 rounded-[20px] sm:rounded-[32px] p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
                        <div>
                            <p className="font-black text-slate-900 text-base sm:text-lg">{p.name}</p>
                            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{p.progress || 0}% complete &bull; Deadline: {p.deadline || 'N/A'}</p>
                            <div className="w-full sm:w-48 h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
                                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${p.progress || 0}%` }} />
                            </div>
                        </div>
                        <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-center self-start sm:self-auto ${statusColor(p.status)}`}>
                            {p.status}
                        </span>
                    </div>
                )) : (
                    <div className="bg-white border border-slate-100 border-dashed rounded-[20px] sm:rounded-[32px] p-10 sm:p-12 text-center">
                        <p className="text-slate-400 font-black uppercase tracking-widest text-[9px] sm:text-[10px]">No projects found for this client.</p>
                    </div>
                )}
            </div>

            {/* Invoices */}
            <div className="space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 sm:gap-3">
                    <CreditCard size={20} className="text-orange-500 sm:size-[22px]" /> Invoices
                </h2>
                {invoices.length > 0 ? invoices.map((inv: any) => (
                    <div key={inv.id} className="bg-white border border-slate-100 rounded-[20px] sm:rounded-[32px] p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
                        <div>
                            <p className="font-black text-slate-900 text-sm sm:text-base">#{inv.invoice_number}</p>
                            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Due: {inv.due_date || 'N/A'}</p>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto mt-2 sm:mt-0">
                            <p className="font-black text-slate-900 text-base sm:text-lg">{inv.currency || 'USD'} {Number(inv.amount).toLocaleString()}</p>
                            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${inv.status === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>
                                {inv.status}
                            </span>
                        </div>
                    </div>
                )) : (
                    <div className="bg-white border border-slate-100 border-dashed rounded-[20px] sm:rounded-[32px] p-10 sm:p-12 text-center">
                        <p className="text-slate-400 font-black uppercase tracking-widest text-[9px] sm:text-[10px]">No invoices found for this client.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
