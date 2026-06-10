'use client';

import { useState, useEffect } from 'react';
import {
    MessageSquare, LifeBuoy, Send, Clock,
    CheckCircle2, AlertCircle, Mail, Phone, Loader2
} from 'lucide-react';
import api from '@/lib/api';

interface Ticket {
    id: number;
    ticket_number: string;
    subject: string;
    status: string;
    priority: string;
    created_at: string;
}

export default function ClientSupportPage() {
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchingTickets, setFetchingTickets] = useState(true);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [lastTicketNo, setLastTicketNo] = useState('');
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        subject: '',
        description: '',
        service: '',
        priority: 'standard',
    });

    // ── Fetch existing tickets ────────────────────────────────────────────────
    useEffect(() => {
        api.get('/support-tickets')
            .then(res => setTickets(res.data))
            .catch(() => { })
            .finally(() => setFetchingTickets(false));
    }, [submitted]);

    // ── Submit new ticket ─────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!form.subject.trim() || !form.description.trim()) {
            setError('Subject and description are required.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/support-tickets', form);
            setLastTicketNo(res.data.ticket_number);
            setSubmitted(true);
            setForm({ subject: '', description: '', service: '', priority: 'standard' });
        } catch {
            setError('Failed to submit ticket. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const statusColor = (s: string) => {
        if (s === 'resolved' || s === 'closed') return 'bg-green-50 text-green-600';
        if (s === 'in_progress') return 'bg-blue-50 text-blue-600';
        return 'bg-orange-50 text-orange-600';
    };

    const priorityColor = (p: string) => {
        if (p === 'critical') return 'text-red-500';
        if (p === 'high') return 'text-orange-500';
        return 'text-slate-400';
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-10 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight uppercase">Support Center</h1>
                    <p className="text-slate-500 mt-2 font-medium text-base sm:text-lg italic">Get expert assistance for your projects and services.</p>
                </div>
                <div className="bg-white border border-slate-100 px-6 sm:px-8 py-4 sm:py-5 rounded-[18px] sm:rounded-[24px] flex items-center gap-4 sm:gap-5 shadow-sm self-start md:self-auto">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-[14px] sm:rounded-[18px] flex items-center justify-center text-green-600 shadow-inner border border-green-100">
                        <Clock size={20} className="sm:size-[24px]" />
                    </div>
                    <div>
                        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Average Response</p>
                        <p className="text-slate-900 font-black text-base sm:text-lg tracking-tighter">~ 2 Hours</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
                {/* ── Support Form ── */}
                <div className="lg:col-span-2">
                    <div className="bg-white border border-slate-100 p-6 sm:p-16 rounded-[24px] sm:rounded-[64px] shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 orange-gradient opacity-5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

                        {!submitted ? (
                            <div className="space-y-6 sm:space-y-10">
                                <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-10">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 orange-gradient rounded-[16px] sm:rounded-[24px] flex items-center justify-center text-white shadow-2xl shadow-orange-500/20 shrink-0">
                                        <MessageSquare size={24} className="sm:size-[32px]" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight uppercase">Open Support Ticket</h2>
                                        <p className="text-slate-500 text-xs sm:text-sm font-medium italic">Describe your issue and our engineers will engage shortly.</p>
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600 text-xs sm:text-sm font-bold">
                                        <AlertCircle size={18} /> {error}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                                    <div className="space-y-2 sm:space-y-3">
                                        <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Strategic Service</label>
                                        <select
                                            value={form.service}
                                            onChange={e => setForm({ ...form, service: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-[16px] sm:rounded-[20px] py-3.5 sm:py-4 px-6 sm:px-8 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all appearance-none cursor-pointer shadow-sm text-sm"
                                        >
                                            <option value="">Select Asset</option>
                                            <option value="Web Development Project">Web Development Project</option>
                                            <option value="Premium Hosting">Premium Hosting</option>
                                            <option value="Domain Management">Domain Management</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2 sm:space-y-3">
                                        <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Urgency Protocol</label>
                                        <select
                                            value={form.priority}
                                            onChange={e => setForm({ ...form, priority: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-[16px] sm:rounded-[20px] py-3.5 sm:py-4 px-6 sm:px-8 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all appearance-none cursor-pointer shadow-sm text-sm"
                                        >
                                            <option value="standard">Standard Velocity</option>
                                            <option value="high">High Priority</option>
                                            <option value="critical">Critical Deployment</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2 space-y-2 sm:space-y-3">
                                        <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Strategic Subject</label>
                                        <input
                                            type="text"
                                            value={form.subject}
                                            onChange={e => setForm({ ...form, subject: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-[16px] sm:rounded-[20px] py-3.5 sm:py-4 px-6 sm:px-8 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all placeholder-slate-300 shadow-sm text-sm"
                                            placeholder="Brief summary of the issue"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2 sm:space-y-3">
                                        <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Incident Description</label>
                                        <textarea
                                            rows={6}
                                            value={form.description}
                                            onChange={e => setForm({ ...form, description: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-[20px] sm:rounded-[32px] py-4 sm:py-6 px-6 sm:px-8 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all resize-none placeholder-slate-300 shadow-sm text-sm"
                                            placeholder="Provide as much technical detail as possible..."
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="w-full py-4 sm:py-6 orange-gradient text-white rounded-[18px] sm:rounded-[24px] text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-orange-500/30 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                    {loading ? 'Submitting...' : 'Submit Dispatch Request'}
                                </button>
                            </div>
                        ) : (
                            <div className="py-12 sm:py-20 text-center space-y-6 sm:space-y-10 animate-in zoom-in duration-500">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-50 rounded-[30px] sm:rounded-[40px] flex items-center justify-center text-green-600 mx-auto border border-green-100 shadow-inner">
                                    <CheckCircle2 size={40} className="sm:size-[48px]" />
                                </div>
                                <div className="space-y-2 sm:space-y-3">
                                    <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">Request Received</h2>
                                    <p className="text-slate-500 max-w-sm mx-auto text-xs sm:text-sm font-medium italic">
                                        Your ticket <strong className="text-slate-900">#{lastTicketNo}</strong> has been established. A specialist will engage via email shortly.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="px-8 sm:px-12 py-4 sm:py-5 bg-slate-900 text-white rounded-[16px] sm:rounded-[20px] text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
                                >
                                    New Support Session
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Sidebar ── */}
                <div className="space-y-6 sm:space-y-10">
                     {/* Active Tickets */}
                     <div className="bg-white border border-slate-100 p-6 sm:p-10 rounded-[24px] sm:rounded-[48px] shadow-sm">
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-6 sm:mb-8 uppercase tracking-tight">Active Dossiers</h3>
                        <div className="space-y-4 sm:space-y-6">
                            {fetchingTickets ? (
                                 <div className="flex items-center justify-center py-8">
                                     <Loader2 size={24} className="animate-spin text-slate-300" />
                                 </div>
                            ) : tickets.length === 0 ? (
                                 <div className="text-center py-8 text-slate-400">
                                     <LifeBuoy size={32} className="mx-auto mb-3 opacity-30" />
                                     <p className="text-[10px] font-black uppercase tracking-widest">No active tickets</p>
                                 </div>
                            ) : tickets.map((ticket) => (
                                 <div key={ticket.id} className="p-4 sm:p-6 rounded-[20px] sm:rounded-[28px] bg-slate-50 border border-slate-100 hover:border-orange-500/30 transition-all group cursor-pointer shadow-inner">
                                     <div className="flex justify-between items-center mb-4">
                                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{ticket.ticket_number}</span>
                                         <span className={`text-[10px] px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-black uppercase tracking-widest ${statusColor(ticket.status)}`}>
                                             {ticket.status.replace('_', ' ')}
                                         </span>
                                     </div>
                                     <p className="text-sm font-black text-slate-900 mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors uppercase tracking-tight">{ticket.subject}</p>
                                     <div className="flex items-center justify-between">
                                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                             {new Date(ticket.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                         </p>
                                         <span className={`text-[10px] font-black uppercase tracking-widest ${priorityColor(ticket.priority)}`}>
                                             {ticket.priority}
                                         </span>
                                     </div>
                                 </div>
                            ))}
                        </div>
                    </div>

                    {/* Direct Contact */}
                    <div className="orange-gradient p-6 sm:p-10 rounded-[24px] sm:rounded-[48px] text-white shadow-2xl shadow-orange-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                        <h3 className="text-xl sm:text-2xl font-black mb-6 sm:mb-8 uppercase tracking-tight">Rapid Response</h3>
                        <div className="space-y-6 sm:space-y-8">
                            <div className="flex items-center gap-4 sm:gap-5">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-[14px] sm:rounded-[20px] flex items-center justify-center backdrop-blur-md shadow-xl border border-white/20 shrink-0">
                                    <Phone size={20} className="sm:size-[24px]" />
                                </div>
                                <div>
                                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-70">Hotline Protocol</p>
                                    <a href="tel:+94769988123" className="font-black text-base sm:text-lg tracking-tighter hover:underline block">+94 76 998 8123</a>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 sm:gap-5">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-[14px] sm:rounded-[20px] flex items-center justify-center backdrop-blur-md shadow-xl border border-white/20 shrink-0">
                                    <Mail size={20} className="sm:size-[24px]" />
                                </div>
                                <div>
                                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-70">Direct Dispatch</p>
                                    <a href="mailto:admin@webbuilders.lk" className="font-black text-base sm:text-lg tracking-tighter hover:underline block truncate max-w-[180px] sm:max-w-none">admin@webbuilders.lk</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
