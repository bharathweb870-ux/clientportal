'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Layout, Calendar, DollarSign, Users, TrendingUp, Save, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function ProjectDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<any>({});

    useEffect(() => {
        api.get(`/projects/${id}`).then(res => {
            setProject(res.data);
            setForm(res.data);
        }).catch(() => router.push('/admin/projects'))
        .finally(() => setLoading(false));
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/projects/${id}`, form);
            setProject(form);
            alert('Project updated successfully!');
        } catch { alert('Failed to update project.'); }
        finally { setSaving(false); }
    };

    if (loading) return (
        <div className="h-[60vh] flex items-center justify-center">
            <Loader2 className="animate-spin text-orange-500" size={60} />
        </div>
    );

    if (!project) return null;

    const progressNum = parseInt(form.progress) || 0;

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex items-center gap-6">
                <Link href="/admin/projects" className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-orange-600 transition-all shadow-sm">
                    <ChevronLeft size={28} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">{project.name}</h1>
                    <p className="text-slate-400 text-sm font-bold mt-1">Client: {project.client_name || 'N/A'} &bull; ID #{project.id}</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="orange-gradient text-white px-8 py-4 rounded-[20px] font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-xl shadow-orange-500/20 hover:scale-105 transition-all disabled:opacity-50">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Main Card */}
            <div className="bg-white border border-slate-100 rounded-[48px] p-12 shadow-sm space-y-10">

                {/* Progress */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deployment Progress</label>
                        <span className="text-2xl font-black text-orange-500">{progressNum}%</span>
                    </div>
                    <input type="range" name="progress" min={0} max={100} value={progressNum} onChange={handleChange}
                        className="w-full h-3 rounded-full accent-orange-500 cursor-pointer" />
                    <div className="w-full h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                        <div className="h-full orange-gradient rounded-full transition-all duration-500 shadow-lg shadow-orange-500/20" style={{ width: `${progressNum}%` }}></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Status */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Project Status</label>
                        <select name="status" value={form.status || ''} onChange={handleChange}
                            className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 px-6 text-slate-900 font-black outline-none focus:ring-4 focus:ring-orange-500/10 appearance-none cursor-pointer">
                            <option value="In Progress">In Progress</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* Deadline */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Deployment Deadline</label>
                        <div className="relative">
                            <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input type="date" name="deadline" value={form.deadline || ''} onChange={handleChange}
                                className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 pl-14 pr-6 text-slate-900 font-black outline-none focus:ring-4 focus:ring-orange-500/10" />
                        </div>
                    </div>

                    {/* Total Value */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Project Value (LKR)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input type="number" name="total_value" value={form.total_value || ''} onChange={handleChange}
                                className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 pl-14 pr-6 text-slate-900 font-black outline-none focus:ring-4 focus:ring-orange-500/10" />
                        </div>
                    </div>

                    {/* Advance */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Advance Paid (LKR)</label>
                        <div className="relative">
                            <TrendingUp className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input type="number" name="advance_payment" value={form.advance_payment || ''} onChange={handleChange}
                                className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 pl-14 pr-6 text-slate-900 font-black outline-none focus:ring-4 focus:ring-orange-500/10" />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2 space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Project Description</label>
                        <textarea name="description" value={form.description || ''} onChange={handleChange} rows={5}
                            className="w-full bg-slate-50 border border-slate-100 rounded-[24px] py-4 px-6 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-orange-500/10 resize-none" />
                    </div>
                </div>
            </div>
        </div>
    );
}
