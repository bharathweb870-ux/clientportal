'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, User, Mail, Phone, Building2, Globe, Save, Loader2, Users, Shield, Clock } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function ClientDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [client, setClient] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<any>({});

    useEffect(() => {
        api.get(`/clients/${id}`).then(res => {
            setClient(res.data);
            setForm(res.data);
        }).catch(() => router.push('/admin/clients'))
        .finally(() => setLoading(false));
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/clients/${id}`, form);
            setClient(form);
            alert('Client updated successfully!');
        } catch { alert('Failed to update client.'); }
        finally { setSaving(false); }
    };

    if (loading) return (
        <div className="h-[60vh] flex items-center justify-center">
            <Loader2 className="animate-spin text-orange-500" size={60} />
        </div>
    );

    if (!client) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex items-center gap-6">
                <Link href="/admin/clients" className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-orange-600 transition-all shadow-sm">
                    <ChevronLeft size={28} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">{client.full_name || client.name}</h1>
                    <p className="text-slate-400 text-sm font-bold mt-1">{client.company_name || 'Individual'} &bull; ID #{client.id}</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="orange-gradient text-white px-8 py-4 rounded-[20px] font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-xl shadow-orange-500/20 hover:scale-105 transition-all disabled:opacity-50">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Profile Summary */}
            <div className="bg-white border border-slate-100 rounded-[48px] p-12 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-32 h-32 orange-gradient rounded-[40px] flex items-center justify-center text-white font-black text-5xl shadow-2xl shadow-orange-500/20">
                        {(client.full_name || client.name || 'C')[0]}
                    </div>
                    <div>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${client.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                            {client.status}
                        </span>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input name="full_name" value={form.full_name || ''} onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 pl-14 pr-6 text-slate-900 font-black outline-none focus:ring-4 focus:ring-orange-500/10" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Company Name</label>
                            <div className="relative">
                                <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input name="company_name" value={form.company_name || ''} onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 pl-14 pr-6 text-slate-900 font-black outline-none focus:ring-4 focus:ring-orange-500/10" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input name="email" value={form.email || ''} onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 pl-14 pr-6 text-slate-900 font-black outline-none focus:ring-4 focus:ring-orange-500/10" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input name="phone" value={form.phone || ''} onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 pl-14 pr-6 text-slate-900 font-black outline-none focus:ring-4 focus:ring-orange-500/10" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Strategic Details */}
            <div className="bg-white border border-slate-100 rounded-[48px] p-12 shadow-sm">
                <div className="flex items-center gap-3 mb-10">
                    <Globe size={24} className="text-orange-500" />
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Strategic Assets</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Primary Domain</label>
                        <input name="domain_name" value={form.domain_name || ''} onChange={handleChange}
                            className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 px-6 text-slate-900 font-black outline-none focus:ring-4 focus:ring-orange-500/10" />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Account Status</label>
                        <select name="status" value={form.status || ''} onChange={handleChange}
                            className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 px-6 text-slate-900 font-black outline-none focus:ring-4 focus:ring-orange-500/10 appearance-none cursor-pointer">
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
