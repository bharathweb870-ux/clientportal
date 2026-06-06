'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    Search, 
    Plus, 
    Filter, 
    MoreHorizontal,
    Rocket,
    Clock,
    CheckCircle2,
    Layout,
    ArrowRight,
    Loader2,
    Shield,
    AlertCircle,
    Calendar
} from 'lucide-react';
import api from '@/lib/api';

export default function ProjectsPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthMissing, setIsAuthMissing] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    const isWebsiteOrder = (project: any) => {
        const name = String(project?.name || '').toLowerCase();
        return name.startsWith('website order -');
    };

    const pendingWebsiteOrders = projects.filter((project) => {
        if (!isWebsiteOrder(project)) return false;

        const approvalStatus = String(project?.approval_status || '').toLowerCase();
        const status = String(project?.status || '').toLowerCase();

        if (approvalStatus === 'approved') return false;
        return approvalStatus === 'pending' || status === 'pending' || !['cancelled', 'completed', 'approved'].includes(status);
    });

    const approveWebsiteOrder = async (projectId: number) => {
        try {
            await api.post(`/projects/${projectId}/approve-website-order`);
        } catch (error: any) {
            if (error.response?.status === 404) {
                await api.put(`/projects/${projectId}`, {
                    status: 'In Progress',
                    approval_status: 'approved',
                    approval_notes: 'Approved by admin.',
                });
            } else {
                console.error('Failed to approve website order', error);
                alert('Could not approve website order. Please try again.');
                return;
            }
        } finally {
            await fetchProjects();
        }
    };

    const fetchProjects = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        if (!token) {
            setIsAuthMissing(true);
            setLoading(false);
            return;
        }

        try {
            setIsAuthMissing(false);
            const response = await api.get('/projects');
            setProjects(response.data);
        } catch (error: any) {
            console.error('Failed to fetch projects', error);
            if (error.response?.status === 401) {
                setIsAuthMissing(true);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase">Project Pipeline</h1>
                    <p className="text-slate-500 mt-2 font-medium text-lg italic">Track development progress and delivery milestones.</p>
                </div>
                <Link 
                    href="/admin/projects/new"
                    className="flex items-center justify-center gap-3 orange-gradient text-white px-10 py-5 rounded-[24px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-orange-500/30"
                >
                    <Plus size={20} />
                    New Project
                </Link>
            </div>

            {loading ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-slate-400 gap-4">
                    <Loader2 className="animate-spin text-orange-500" size={60} />
                    <p className="font-black tracking-widest uppercase text-[10px]">Loading Pipeline...</p>
                </div>
            ) : isAuthMissing ? (
                <div className="bg-white border border-slate-100 rounded-[48px] p-20 text-center flex flex-col items-center justify-center gap-8 shadow-sm">
                    <div className="w-24 h-24 bg-orange-50 rounded-[32px] flex items-center justify-center text-orange-500 border border-orange-100 shadow-xl shadow-orange-500/10">
                        <Shield size={48} />
                    </div>
                    <div className="space-y-2">
                        <p className="text-slate-900 font-black text-2xl uppercase tracking-tighter">Auth Required</p>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto font-medium">Please authenticate to view the development pipeline.</p>
                        <button 
                            onClick={fetchProjects}
                            className="mt-8 px-10 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/20"
                        >
                            Establish Connection
                        </button>
                    </div>
                </div>
            ) : projects.length > 0 ? (
                <div className="space-y-10">
                    {pendingWebsiteOrders.length > 0 && (
                        <section className="bg-blue-50 border border-blue-100 rounded-[48px] p-10 shadow-sm">
                            <div className="flex items-center justify-between gap-6 mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Pending Website Orders</h2>
                                    <p className="text-blue-600/70 font-bold text-xs mt-1 uppercase tracking-widest">{pendingWebsiteOrders.length} approval requests waiting</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {pendingWebsiteOrders.map((project) => (
                                    <div key={project.id} className="bg-white border border-slate-100 p-8 rounded-[32px] shadow-sm">
                                        <div className="flex items-start justify-between gap-4 mb-6">
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 tracking-tight">{project.name}</h3>
                                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Client: {project.client_name || 'N/A'}</p>
                                            </div>
                                            <span className="px-4 py-2 rounded-full bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-[0.2em]">
                                                Pending
                                            </span>
                                        </div>

                                        <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6 line-clamp-3">
                                            {project.description || 'Website order awaiting admin approval.'}
                                        </p>

                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                {project.currency || 'LKR'} {Number(project.final_price || project.total_value || 0).toLocaleString()}
                                            </span>
                                            <button
                                                onClick={() => approveWebsiteOrder(project.id)}
                                                className="px-5 py-3 bg-slate-900 text-white rounded-[18px] text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-sm"
                                            >
                                                Approve
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {projects.map((project) => (
                            <div key={project.id} className="bg-white border border-slate-100 p-10 rounded-[48px] shadow-sm hover:border-orange-500/30 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 opacity-30 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                            
                            <div className="flex items-start justify-between mb-8 z-10 relative">
                                <div className="w-16 h-16 bg-slate-50 text-orange-600 rounded-[20px] flex items-center justify-center shadow-sm group-hover:bg-orange-600 group-hover:text-white transition-all duration-500">
                                    <Layout size={32} />
                                </div>
                                <span className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${
                                    ['Completed','completed'].includes(project.status) ? 'bg-green-50 text-green-600' : 
                                    ['In Progress','in progress'].includes(project.status) ? 'bg-blue-50 text-blue-600' : 
                                    ['On Hold','on hold'].includes(project.status) ? 'bg-yellow-50 text-yellow-600' :
                                    'bg-orange-50 text-orange-600'
                                }`}>
                                    {project.status}
                                </span>
                            </div>

                            <div className="z-10 relative">
                                <h3 className="text-3xl font-black text-slate-900 mb-2 group-hover:text-orange-600 transition-colors tracking-tight">{project.name}</h3>
                                <div className="flex items-center gap-2 mb-10 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                    <Shield size={12} className="text-orange-500" />
                                    Client: {project.client_name || 'Individual Account'}
                                </div>

                                <div className="space-y-5">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-slate-400">Velocity Status</span>
                                        <span className="text-slate-900">{project.progress || 0}% Deployment</span>
                                    </div>
                                    <div className="w-full h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-1">
                                        <div 
                                            className="h-full orange-gradient rounded-full transition-all duration-1000 shadow-lg shadow-orange-500/20"
                                            style={{ width: `${project.progress || 0}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="mt-10 pt-10 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5 text-slate-500 text-sm font-bold">
                                        <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                            <Calendar size={14} />
                                        </div>
                                        {project.deadline || 'No Deadline Set'}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => {
                                                if(confirm(`Delete project ${project.name}?`)) {
                                                    api.delete(`/projects/${project.id}`).then(() => fetchProjects());
                                                }
                                            }}
                                            className="w-12 h-12 flex items-center justify-center bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-[18px] transition-all"
                                        >
                                            <AlertCircle size={20} />
                                        </button>
                                        <Link 
                                            href={`/admin/projects/${project.id}`}
                                            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 group/btn"
                                        >
                                            Details <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                        ))}
                </div>
                </div>
            ) : (
                <div className="bg-white border border-slate-100 rounded-[48px] p-20 text-center flex flex-col items-center gap-6 shadow-sm">
                    <Rocket size={60} className="text-slate-100" />
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">No active projects detected in the pipeline.</p>
                </div>
            )}
        </div>
    );
}
