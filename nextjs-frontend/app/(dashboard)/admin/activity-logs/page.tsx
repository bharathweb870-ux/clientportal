'use client';

import { useState, useEffect } from 'react';
import { 
    History,
    Search, 
    Filter, 
    Clock,
    User,
    Shield,
    Globe,
    AlertCircle,
    Loader2
} from 'lucide-react';
import api from '@/lib/api';

export default function ActivityLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await api.get('/activity-logs');
            setLogs(response.data);
        } catch (error) {
            console.error('Failed to fetch activity logs:', error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action: string) => {
        if (action.includes('FAILED')) return 'bg-red-50 text-red-600';
        if (action.includes('APPROVED')) return 'bg-green-50 text-green-600';
        if (action.includes('REGISTERED') || action.includes('PENDING')) return 'bg-blue-50 text-blue-600';
        return 'bg-slate-50 text-slate-600';
    };

    const filteredLogs = logs.filter(log => 
        (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.user_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-4">
                        <History size={48} className="text-orange-500" />
                        Security Audit
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium text-lg italic">Monitor all system activities and security events.</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm">
                <div className="relative max-w-md group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search audit logs..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 pl-16 pr-8 text-sm text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white border border-slate-100 rounded-[48px] overflow-hidden shadow-sm min-h-[400px] flex flex-col">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
                        <Loader2 className="animate-spin text-orange-500" size={60} />
                        <p className="font-black tracking-widest uppercase text-[10px]">Fetching Audit Data...</p>
                    </div>
                ) : filteredLogs.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timestamp</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">User & Role</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Details</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="p-8 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                                                <Clock size={14} className="text-orange-500" />
                                                {new Date(log.created_at).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                                                    <User size={14} className="text-slate-400" />
                                                    {log.user_email || 'Anonymous'}
                                                </div>
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{log.role}</span>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${getActionColor(log.action)}`}>
                                                {log.action.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="p-8">
                                            <p className="text-sm text-slate-600 font-medium max-w-xs">{log.description}</p>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                                                <Globe size={14} />
                                                {log.ip_address}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center gap-6">
                        <AlertCircle size={60} className="text-slate-100" />
                        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">No activity logs found yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
