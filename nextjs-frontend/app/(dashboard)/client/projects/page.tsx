'use client';

import { useState, useEffect } from 'react';
import { 
    Layout, 
    Clock, 
    CheckCircle2, 
    ChevronRight,
    Loader2,
    Shield,
    ArrowRight,
    Server,
    Globe,
    ExternalLink
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

export default function ClientProjectsPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthMissing, setIsAuthMissing] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('client_token') : null;
        if (!token) {
            setIsAuthMissing(true);
            setLoading(false);
            return;
        }

        try {
            setIsAuthMissing(false);
            const response = await api.get('/dashboard'); 
            setProjects(response.data.projects || []);
        } catch (error: any) {
            console.error('Failed to fetch projects', error);
            if (error.response?.status === 401) {
                setIsAuthMissing(true);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[600px] flex flex-col items-center justify-center text-slate-400 gap-4">
                <Loader2 className="animate-spin text-orange-500" size={60} />
                <p className="font-black tracking-widest uppercase text-[10px]">Synchronizing Development Assets...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-10 animate-in fade-in duration-700 pb-20">
            <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight uppercase">Project Pipeline</h1>
                <p className="text-slate-500 mt-2 font-medium text-base sm:text-lg italic">Monitor development progress and production milestones.</p>
            </div>

            {projects.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                    {projects.map((project) => (
                        <div key={project.id} className="bg-white border border-slate-100 p-6 sm:p-12 rounded-[24px] sm:rounded-[48px] shadow-sm relative overflow-hidden group hover:border-orange-500/30 transition-all">
                            <div className="absolute top-0 right-0 w-64 h-64 orange-gradient opacity-5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
                            
                            <div className="flex items-start justify-between mb-6 sm:mb-10">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 text-orange-600 rounded-[14px] sm:rounded-[20px] flex items-center justify-center shadow-sm group-hover:bg-orange-600 group-hover:text-white transition-all duration-500">
                                    <Layout size={24} className="sm:size-[32px]" />
                                </div>
                                <span className={`px-4 sm:px-6 py-1.5 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] ${
                                    ['Completed','completed'].includes(project.status) ? 'bg-green-50 text-green-600' : 
                                    ['In Progress','in progress'].includes(project.status) ? 'bg-blue-50 text-blue-600' : 
                                    ['On Hold','on hold'].includes(project.status) ? 'bg-yellow-50 text-yellow-600' :
                                    'bg-orange-50 text-orange-600'
                                }`}>
                                    {project.status}
                                </span>
                            </div>

                            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 sm:mb-4 group-hover:text-orange-600 transition-colors tracking-tight">{project.name}</h3>
                            <p className="text-slate-500 mb-6 sm:mb-10 leading-relaxed font-medium italic line-clamp-2 text-sm sm:text-base">{project.description || 'Enterprise-grade digital solution development in progress.'}</p>

                            <div className="space-y-4 sm:space-y-6">
                                <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">
                                    <span className="text-slate-400">Development Velocity</span>
                                    <span className="text-slate-900">{project.progress || 0}% Execution</span>
                                </div>
                                <div className="w-full h-3 sm:h-4 bg-slate-50 rounded-full overflow-hidden p-0.5 sm:p-1 border border-slate-100 shadow-inner">
                                    <div 
                                        className="h-full orange-gradient rounded-full transition-all duration-1000 shadow-lg shadow-orange-500/20"
                                        style={{ width: `${project.progress || 0}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="mt-8 sm:mt-12 pt-6 sm:pt-10 border-t border-slate-50 grid grid-cols-2 gap-4 sm:gap-8">
                                <div>
                                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1 sm:mb-2">Estimated Delivery</p>
                                    <div className="flex items-center gap-2 text-slate-900 font-black text-sm sm:text-base">
                                        <Clock size={16} className="text-orange-600" />
                                        {project.deadline || 'Q3 2026'}
                                    </div>
                                </div>
                                <div className="flex items-end justify-end">
                                    <button className="flex items-center gap-2 sm:gap-3 text-slate-900 font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] hover:text-orange-600 transition-all group">
                                        View Specs <ArrowRight size={14} className="sm:size-[18px] group-hover:translate-x-2 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white border border-slate-100 rounded-[32px] sm:rounded-[64px] p-12 sm:p-20 lg:p-32 text-center flex flex-col items-center gap-6 sm:gap-10 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 orange-gradient opacity-5 pointer-events-none"></div>
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-50 rounded-[24px] sm:rounded-[32px] flex items-center justify-center text-slate-200 relative z-10 border border-slate-100 shadow-inner">
                        <Shield size={36} className="sm:size-[48px]" />
                    </div>
                    <div className="space-y-2 sm:space-y-3 relative z-10">
                        <p className="text-slate-900 font-black text-xl sm:text-2xl uppercase tracking-tighter">No Active Deployments</p>
                        <p className="text-slate-500 max-w-xs mx-auto text-xs sm:text-sm font-medium italic">You don't have any strategic projects in development at the moment.</p>
                    </div>
                    <Link href="/client/support" className="px-8 sm:px-12 py-4 sm:py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-[18px] sm:rounded-[24px] text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/20 relative z-10">
                        Request Strategy Session
                    </Link>
                </div>
            )}
        </div>
    );
}
