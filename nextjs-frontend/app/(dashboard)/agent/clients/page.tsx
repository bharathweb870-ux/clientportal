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
    Building2,
    Calendar,
    ArrowUpRight,
    Loader2,
    Shield
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function AgentClientsPage() {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAuthMissing, setIsAuthMissing] = useState(false);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('agent_token') : null;
        if (!token) {
            console.error('No token found. Please login first.');
            setIsAuthMissing(true);
            setLoading(false);
            return;
        }

        try {
            setIsAuthMissing(false);
            const response = await api.get('/clients');
            setClients(response.data);
        } catch (error: any) {
            console.error('Failed to fetch clients', error);
            if (error.response?.status === 401) {
                setIsAuthMissing(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(client => 
        (client.full_name || client.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.company_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderServices = (client: any) => {
        let serviceList: string[] = [];
        if (client.status === 'pending' && client.pending_data) {
            let pData = client.pending_data;
            if (typeof pData === 'string') {
                try { pData = JSON.parse(pData); } catch(e) {}
            }
            if (pData?.services) {
                if (pData.services.hosting?.selected) serviceList.push(`Hosting: ${pData.services.hosting.package_name}`);
                if (pData.services.management?.selected) serviceList.push(`Management: ${pData.services.management.package_name}`);
                if (pData.services.development?.selected) serviceList.push(`Development: ${pData.services.development.project_name || 'Custom'}`);
            }
        } else if (client.services && client.services.length > 0) {
            serviceList = client.services.map((s: any) => `${s.service_type.charAt(0).toUpperCase() + s.service_type.slice(1)}: ${s.package_name || s.project_name || 'Custom'}`);
        }

        if (serviceList.length === 0) return null;

        return (
            <div className="flex flex-wrap gap-2 mt-3">
                {serviceList.map((service, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-600 text-[9px] font-black uppercase px-2 py-1 rounded-md border border-slate-200">
                        {service}
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase">Your Clients</h1>
                    <p className="text-slate-500 mt-2 font-medium text-lg italic">Manage and support the clients you have registered.</p>
                </div>
                <Link 
                    href="/agent/clients/new"
                    className="flex items-center justify-center gap-3 orange-gradient text-white px-10 py-5 rounded-[24px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-orange-500/30"
                >
                    <Plus size={20} />
                    Register New Client
                </Link>
            </div>

            {/* Filters Bar */}
            <div className="bg-white border border-slate-100 p-6 rounded-[32px] flex flex-wrap items-center gap-6 shadow-sm">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search your clients..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 pl-16 pr-8 text-sm text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Clients Table */}
            <div className="bg-white border border-slate-100 rounded-[48px] overflow-hidden shadow-sm min-h-[400px] flex flex-col">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
                        <Loader2 className="animate-spin text-orange-500" size={60} />
                        <p className="font-black tracking-widest uppercase text-[10px]">Loading Clients...</p>
                    </div>
                ) : isAuthMissing ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 p-20">
                        <div className="w-24 h-24 bg-orange-50 rounded-[32px] flex items-center justify-center text-orange-500 border border-orange-100 shadow-xl shadow-orange-500/10">
                            <Shield size={48} />
                        </div>
                        <div className="space-y-2">
                            <p className="text-slate-900 font-black text-2xl uppercase tracking-tighter">Auth Required</p>
                            <p className="text-slate-500 text-sm max-w-xs mx-auto font-medium">Please authenticate to view your clients.</p>
                            <button 
                                onClick={fetchClients}
                                className="mt-8 px-10 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/20"
                            >
                                Retry Connection
                            </button>
                        </div>
                    </div>
                ) : filteredClients.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Client & Company</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact Details</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredClients.map((client) => (
                                    <tr key={client.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="p-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-16 h-16 orange-gradient rounded-[24px] flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-orange-500/20 group-hover:scale-110 transition-transform">
                                                    {(client.full_name || client.name || 'C')[0]}
                                                </div>
                                                <div>
                                                    <p className="text-slate-900 font-black text-lg">{client.full_name || client.name || 'Unnamed Client'}</p>
                                                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
                                                        <Building2 size={12} className="text-orange-500" />
                                                        {client.company_name || client.company || 'Individual Account'}
                                                    </div>
                                                    {renderServices(client)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2.5 text-slate-600 text-sm font-bold">
                                                    <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                                        <Mail size={14} />
                                                    </div>
                                                    {client.email || 'No Email'}
                                                </div>
                                                <div className="flex items-center gap-2.5 text-slate-600 text-sm font-bold">
                                                    <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                                        <Phone size={14} />
                                                    </div>
                                                    {client.phone || client.whatsapp || 'No Phone'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex flex-col gap-2">
                                                <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-center ${
                                                    client.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                                                }`}>
                                                    Acc: {client.status || 'Active'}
                                                </span>
                                                <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-center ${
                                                    client.payment_status === 'Paid' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'
                                                }`}>
                                                    Pay: {client.payment_status || 'Pending'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-8 text-right">
                                            <Link href={`/agent/clients/${client.id}`} className="px-6 py-3 bg-slate-900 text-white rounded-[18px] text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 transition-all shadow-sm">
                                                Manage
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center gap-6">
                        <Users size={60} className="text-slate-100" />
                        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">No clients found. Try registering a new one!</p>
                    </div>
                )}
            </div>
        </div>
    );
}