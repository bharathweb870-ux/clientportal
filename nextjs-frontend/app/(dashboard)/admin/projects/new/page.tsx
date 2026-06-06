'use client';

import { 
    Layout, 
    Users, 
    Calendar, 
    DollarSign,
    Rocket,
    Save,
    ChevronLeft,
    FileText
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function NewProjectPage() {
    const router = useRouter();
    const [clients, setClients] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingClients, setIsFetchingClients] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        client_id: '',
        deadline: '',
        total_value: '',
        advance_payment: '',
        description: '',
    });

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const res = await api.get('/clients');
            setClients(res.data);
        } catch (error) {
            console.error('Failed to fetch clients:', error);
        } finally {
            setIsFetchingClients(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/projects', formData);
            router.push('/admin/projects');
        } catch (error) {
            console.error('Failed to create project:', error);
            alert('Failed to create project. Please check the console for details.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <Link 
                        href="/admin/projects"
                        className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-orange-600 hover:border-orange-100 transition-all shadow-sm"
                    >
                        <ChevronLeft size={28} />
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Launch Project</h1>
                        <p className="text-slate-500 mt-1 font-medium italic">Initialize a new web development asset.</p>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-100 p-12 rounded-[48px] shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 orange-gradient opacity-5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                    <div className="md:col-span-2 flex items-center gap-4 text-orange-600 mb-2">
                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                            <Layout size={24} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Project Brief</h3>
                    </div>
                    
                    <div className="md:col-span-2 space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Project Identity (Name)</label>
                        <input 
                            type="text" 
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="e.g. E-commerce Website Development" 
                            className="w-full bg-slate-50 border border-slate-100 rounded-[24px] py-5 px-8 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white focus:border-orange-200 transition-all placeholder-slate-300 shadow-sm" 
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Assigned Client</label>
                        <div className="relative">
                            <Users className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                            <select 
                                name="client_id"
                                value={formData.client_id}
                                onChange={handleChange}
                                required
                                className="w-full bg-slate-50 border border-slate-100 rounded-[24px] py-5 pl-16 pr-8 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white focus:border-orange-200 transition-all appearance-none shadow-sm cursor-pointer"
                            >
                                <option value="">{isFetchingClients ? 'Loading clients...' : 'Select a client...'}</option>
                                {clients.map((client: any) => (
                                    <option key={client.id} value={client.id}>
                                        {client.full_name} {client.company_name ? `(${client.company_name})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Deployment Deadline</label>
                        <div className="relative">
                            <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                            <input 
                                type="date" 
                                name="deadline"
                                value={formData.deadline}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border border-slate-100 rounded-[24px] py-5 pl-16 pr-8 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white focus:border-orange-200 transition-all shadow-sm" 
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Project Valuation</label>
                        <div className="relative">
                            <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                            <input 
                                type="number"
                                name="total_value"
                                value={formData.total_value}
                                onChange={handleChange}
                                placeholder="250000" 
                                className="w-full bg-slate-50 border border-slate-100 rounded-[24px] py-5 pl-16 pr-8 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white focus:border-orange-200 transition-all shadow-sm" 
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Initial Commitment (Advance)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                            <input 
                                type="number" 
                                name="advance_payment"
                                value={formData.advance_payment}
                                onChange={handleChange}
                                placeholder="75000" 
                                className="w-full bg-slate-50 border border-slate-100 rounded-[24px] py-5 pl-16 pr-8 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white focus:border-orange-200 transition-all shadow-sm" 
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Architecture & Scope (Description)</label>
                        <div className="relative">
                            <FileText className="absolute left-6 top-6 text-slate-300" size={20} />
                            <textarea 
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Define the core features and development milestones..." 
                                rows={6} 
                                className="w-full bg-slate-50 border border-slate-100 rounded-[32px] py-6 pl-16 pr-8 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white focus:border-orange-200 transition-all resize-none shadow-sm placeholder-slate-300"
                            ></textarea>
                        </div>
                    </div>
                </div>
                
                <div className="mt-12 pt-10 border-t border-slate-50 flex justify-end gap-6 relative z-10">
                    <Link href="/admin/projects" className="px-10 py-5 bg-slate-100 text-slate-500 rounded-[20px] font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all inline-block">
                        Cancel
                    </Link>
                    <button type="submit" disabled={isLoading} className="px-12 py-5 bg-slate-900 text-white rounded-[20px] font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center gap-2 disabled:opacity-50">
                        <Save size={16} />
                        {isLoading ? 'Saving...' : 'Save Project'}
                    </button>
                </div>
            </div>
        </form>
    );
}
