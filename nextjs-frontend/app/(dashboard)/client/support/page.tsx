'use client';

import { useState } from 'react';
import { 
    MessageSquare, 
    LifeBuoy, 
    Send, 
    Clock, 
    CheckCircle2, 
    ChevronRight,
    AlertCircle,
    Mail,
    Phone,
    ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function ClientSupportPage() {
    const [submitted, setSubmitted] = useState(false);
    const tickets: any[] = []; // Will be populated from API when support module is ready

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase">Support Center</h1>
                    <p className="text-slate-500 mt-2 font-medium text-lg italic">Get expert assistance for your projects and services.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white border border-slate-100 px-8 py-5 rounded-[24px] flex items-center gap-5 shadow-sm">
                        <div className="w-12 h-12 bg-green-50 rounded-[18px] flex items-center justify-center text-green-600 shadow-inner border border-green-100">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Average Response</p>
                            <p className="text-slate-900 font-black text-lg tracking-tighter">~ 2 Hours</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Support Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white border border-slate-100 p-16 rounded-[64px] shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 orange-gradient opacity-5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
                        
                        {!submitted ? (
                            <div className="space-y-10">
                                <div className="flex items-center gap-6 mb-10">
                                    <div className="w-16 h-16 orange-gradient rounded-[24px] flex items-center justify-center text-white shadow-2xl shadow-orange-500/20">
                                        <MessageSquare size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Open Support Ticket</h2>
                                        <p className="text-slate-500 text-sm font-medium italic">Describe your issue and our engineers will engage shortly.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Strategic Service</label>
                                        <select className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 px-8 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all appearance-none cursor-pointer shadow-sm">
                                            <option>Select Asset</option>
                                            <option>Web Development Project</option>
                                            <option>Premium Hosting</option>
                                            <option>Domain Management</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Urgency Protocol</label>
                                        <select className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 px-8 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all appearance-none cursor-pointer shadow-sm">
                                            <option>Standard Velocity</option>
                                            <option>High Priority</option>
                                            <option>Critical Deployment</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2 space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Strategic Subject</label>
                                        <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 px-8 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all placeholder-slate-300 shadow-sm" placeholder="Brief summary of the issue" />
                                    </div>
                                    <div className="md:col-span-2 space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Incident Description</label>
                                        <textarea rows={6} className="w-full bg-slate-50 border border-slate-100 rounded-[32px] py-6 px-8 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all resize-none placeholder-slate-300 shadow-sm" placeholder="Provide as much technical detail as possible..."></textarea>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setSubmitted(true)}
                                    className="w-full py-6 orange-gradient text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-orange-500/30 flex items-center justify-center gap-3"
                                >
                                    <Send size={20} />
                                    Submit Dispatch Request
                                </button>
                            </div>
                        ) : (
                            <div className="py-20 text-center space-y-10 animate-in zoom-in duration-500">
                                <div className="w-24 h-24 bg-green-50 rounded-[40px] flex items-center justify-center text-green-600 mx-auto border border-green-100 shadow-inner">
                                    <CheckCircle2 size={48} />
                                </div>
                                <div className="space-y-3">
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Request Received</h2>
                                    <p className="text-slate-500 max-w-sm mx-auto font-medium italic">Your ticket <strong className="text-slate-900">#TKT-1025</strong> has been established. A specialist will engage via email shortly.</p>
                                </div>
                                <button 
                                    onClick={() => setSubmitted(false)}
                                    className="px-12 py-5 bg-slate-900 text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
                                >
                                    New Support Session
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-10">
                    {/* Active Tickets */}
                    <div className="bg-white border border-slate-100 p-10 rounded-[48px] shadow-sm">
                        <h3 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tight">Active Dossiers</h3>
                        <div className="space-y-6">
                            {tickets.map((ticket) => (
                                <div key={ticket.id} className="p-6 rounded-[28px] bg-slate-50 border border-slate-100 hover:border-orange-500/30 transition-all group cursor-pointer shadow-inner">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ticket.id}</span>
                                        <span className={`text-[10px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest ${
                                            ticket.status === 'Resolved' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                                        }`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                    <p className="text-sm font-black text-slate-900 mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors uppercase tracking-tight">{ticket.subject}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{ticket.date}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Direct Contact */}
                    <div className="orange-gradient p-10 rounded-[48px] text-white shadow-2xl shadow-orange-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                        <h3 className="text-2xl font-black mb-8 uppercase tracking-tight">Rapid Response</h3>
                        <div className="space-y-8">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-white/20 rounded-[20px] flex items-center justify-center backdrop-blur-md shadow-xl border border-white/20">
                                    <Phone size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Hotline protocol</p>
                                    <p className="font-black text-lg tracking-tighter">+94 77 123 4567</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-white/20 rounded-[20px] flex items-center justify-center backdrop-blur-md shadow-xl border border-white/20">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Direct dispatch</p>
                                    <p className="font-black text-lg tracking-tighter">support@webbuilders.lk</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
