'use client';

import { useState, useEffect } from 'react';
import {
    Package,
    CreditCard,
    Calendar,
    AlertCircle,
    ChevronRight,
    Download,
    Globe,
    Server,
    Clock,
    Loader2,
    Shield,
    X,
    CheckCircle2,
    ArrowUpRight,
    Check,
    Minus,
    ShoppingBag,
    ExternalLink
} from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import Link from 'next/link';
import api from '@/lib/api';

export default function ClientDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthMissing, setIsAuthMissing] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [upgrading, setUpgrading] = useState(false);

    const [managementPackages, setManagementPackages] = useState<any[]>([]);
    const [hostingPackages, setHostingPackages] = useState<any[]>([]);

    useEffect(() => {
        fetchClientDashboard();
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const response = await api.get('/packages');
            const data = response.data;
            setHostingPackages(data.filter((pkg: any) => pkg.type === 'hosting'));
            setManagementPackages(data.filter((pkg: any) => pkg.type === 'management'));
        } catch (error) {
            console.error('Failed to fetch packages:', error instanceof Error ? error.message : 'Unknown error');
        }
    };

    const formatCurrencyBreakdown = (breakdown: any) => {
        if (!breakdown || typeof breakdown !== 'object') return '';
        return Object.entries(breakdown)
            .map(([currency, amount]) => `${currency} ${Number(amount || 0).toLocaleString()}`)
            .join(' / ');
    };

    const fetchClientDashboard = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('client_token') : null;
        if (!token) {
            setIsAuthMissing(true);
            setLoading(false);
            return;
        }

        try {
            setIsAuthMissing(false);
            const response = await api.get('/dashboard');
            setStats(response.data);
        } catch (error: any) {
            console.error('Failed to fetch client dashboard:', error instanceof Error ? error.message : 'Unknown error');
            if (error.response?.status === 401) {
                setIsAuthMissing(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (packageName: string) => {
        if (!selectedProject) return;

        setUpgrading(true);
        try {
            const response = await api.post(`/projects/${selectedProject.id}/upgrade`, {
                package: packageName,
                type: selectedProject.type
            });

            setShowUpgradeModal(false);

            if (response.data.requires_payment) {
                alert(`Upgrade invoice generated! Redirecting to payment...`);
                window.location.href = `/client/invoices`; // Redirect to invoices list
            } else {
                fetchClientDashboard();
                alert(`Successfully upgraded to ${packageName}!`);
            }
        } catch (error) {
            console.error('Upgrade failed:', error instanceof Error ? error.message : 'Unknown error');
            alert('Upgrade failed. Please try again.');
        } finally {
            setUpgrading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[600px] flex flex-col items-center justify-center text-slate-400 gap-4">
                <Loader2 className="animate-spin text-orange-500" size={60} />
                <p className="font-bold tracking-widest uppercase text-xs">Preparing Your Portal...</p>
            </div>
        );
    }

    if (isAuthMissing) {
        return (
            <div className="h-[600px] flex flex-col items-center justify-center text-center space-y-8 bg-white rounded-[48px] border border-slate-100 shadow-sm">
                <div className="w-24 h-24 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-500 border border-orange-100 shadow-xl shadow-orange-500/10 animate-pulse">
                    <Shield size={48} />
                </div>
                <div className="space-y-3 px-6">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Secure Access Required</h2>
                    <p className="text-slate-500 text-lg max-w-md mx-auto leading-relaxed font-medium">
                        Secure connection required to access your client portal.
                    </p>
                    <button
                        onClick={fetchClientDashboard}
                        className="mt-6 px-12 py-5 orange-gradient text-white rounded-2xl font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-orange-500/30"
                    >
                        Authenticate Portal
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight">Welcome Back!</h1>
                    <p className="text-slate-500 mt-3 text-lg font-medium">Manage your active services and billing details.</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <Link
                        href="/client/websites"
                        className="flex items-center gap-3 bg-slate-900 text-white px-8 py-5 rounded-[24px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-slate-900/20 text-[10px]"
                    >
                        <ShoppingBag size={18} />
                        Order Website
                    </Link>
                    <a
                        href="/WEBbuilder/html_output/oursites"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-white border border-slate-100 text-slate-700 px-8 py-5 rounded-[24px] font-black uppercase tracking-widest hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm text-[10px]"
                    >
                        <ExternalLink size={18} />
                        Open Webbuilder
                    </a>
                    <Link
                        href="/client/support"
                        className="flex items-center gap-3 orange-gradient text-white px-8 py-5 rounded-[24px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-orange-500/30 text-[10px]"
                    >
                        Get Support
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard
                    title="Active Services"
                    value={String(stats?.active_services || 0).padStart(2, '0')}
                    icon={Package}
                    description="Running projects & hosting"
                />
                <StatCard
                    title="Due Amount"
                    value={
                        Object.keys(stats?.due_amount_breakdown || {}).length > 1
                            ? 'Mixed'
                            : Object.keys(stats?.due_amount_breakdown || {}).length === 1
                                ? `${Object.keys(stats.due_amount_breakdown)[0]} ${Number(stats.due_amount_breakdown[Object.keys(stats.due_amount_breakdown)[0]] || 0).toLocaleString()}`
                                : `${(stats?.due_amount || 0).toLocaleString()}`
                    }
                    icon={CreditCard}
                    trend={{ value: "Pending", positive: false }}
                    description={formatCurrencyBreakdown(stats?.due_amount_breakdown) || 'Pending invoices across services'}
                />
                <StatCard
                    title="Next Renewal"
                    value={stats?.next_renewal || 'None'}
                    icon={Calendar}
                    description="Services & Hosting"
                />
                <StatCard
                    title="Support Tickets"
                    value={String(stats?.support_tickets || 0)}
                    icon={Clock}
                    description="All issues resolved"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Active Services List */}
                <div className="lg:col-span-2 space-y-8">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-4 uppercase tracking-tight">
                        <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center">
                            <Package size={24} />
                        </div>
                        Active Projects
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {stats?.projects?.length > 0 ? stats.projects.map((project: any) => {
                            const isHosting = project.name.toLowerCase().includes('hosting') || (project.package && project.package.toLowerCase().includes('hosting'));

                            return (
                                <div key={project.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm group hover:border-orange-500/30 transition-all relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 orange-gradient opacity-5 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                                    <div className="flex justify-between items-start mb-8 relative z-10">
                                        <div className="w-14 h-14 bg-slate-50 text-orange-600 rounded-2xl flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all duration-500">
                                            {isHosting ? <Globe size={28} /> : <Server size={28} />}
                                        </div>
                                        <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">{project.status}</span>
                                    </div>

                                    <h3 className="text-2xl font-black text-slate-900 mb-2 relative z-10">{project.name}</h3>
                                    <div className="flex items-center gap-2 mb-6 relative z-10">
                                        <div className="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-orange-100">
                                            {project.package || (isHosting ? 'Starter Hosting' : 'Starter Package')}
                                        </div>
                                        <span className="text-slate-400 text-[10px] font-bold italic">Active {isHosting ? 'Hosting' : 'Management'}</span>
                                    </div>

                                    <div className="pt-8 border-t border-slate-50 flex justify-between items-center relative z-10">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">Execution</p>
                                            <p className="text-sm font-black text-slate-900">{project.progress || 0}% Complete</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedProject(project);
                                                setShowUpgradeModal(true);
                                            }}
                                            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2"
                                        >
                                            Upgrade <ArrowUpRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="md:col-span-2 bg-white p-20 rounded-[48px] border border-slate-100 border-dashed text-center flex flex-col items-center gap-6">
                                <Package size={48} className="text-slate-100" />
                                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No active projects found.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Billing Sidebar */}
                <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm flex flex-col">
                    <h2 className="text-2xl font-black text-slate-900 mb-10 text-center uppercase tracking-tight">Financials</h2>
                    <div className="space-y-6 flex-1">
                        {stats?.recent_invoices?.length > 0 ? stats.recent_invoices.map((inv: any, i: number) => (
                            <div key={i} className="p-6 rounded-[32px] bg-slate-50 border border-transparent hover:border-orange-100 transition-all group">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{inv.transaction_id || inv.id}</span>
                                    <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-[0.1em] ${inv.status === 'Paid' || inv.status === 'Success' || inv.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-orange-100 text-orange-600'
                                        }`}>
                                        {inv.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-2xl font-black text-slate-900">{inv.currency || 'USD'} {Number(inv.amount).toLocaleString()}</p>
                                    <button className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 group-hover:text-orange-600 group-hover:border-orange-100 transition-all shadow-sm">
                                        <Download size={20} />
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-4 font-black uppercase tracking-widest">{new Date(inv.created_at).toLocaleDateString()}</p>
                            </div>
                        )) : (
                            <div className="py-10 text-center flex flex-col items-center gap-4">
                                <CreditCard size={40} className="text-slate-100" />
                                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No recent billing activity.</p>
                            </div>
                        )}
                    </div>
                    <button className="w-full mt-10 py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-slate-900/20">
                        Settlement Hub
                    </button>
                </div>
            </div>

            {/* Upgrade Modal */}
            {showUpgradeModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[64px] shadow-2xl relative overflow-hidden flex flex-col lg:flex-row">
                        <button
                            onClick={() => setShowUpgradeModal(false)}
                            className="absolute top-8 right-8 z-20 w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all shadow-sm"
                        >
                            <X size={24} />
                        </button>

                        {/* Left: Branding & Current */}
                        <div className="lg:w-1/4 bg-slate-900 p-12 flex flex-col text-white">
                            <div className="flex items-center gap-3 mb-16">
                                <div className="w-10 h-10 orange-gradient rounded-xl flex items-center justify-center font-black">W</div>
                                <span className="text-xl font-black tracking-tight uppercase">WEBbuilders</span>
                            </div>

                            <div className="flex-1">
                                <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Current Deployment</h3>
                                <div className="p-6 bg-white/5 rounded-[32px] border border-white/10">
                                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">{selectedProject?.name}</p>
                                    <p className="text-xl font-black leading-tight mb-4">{selectedProject?.package || 'Starter Plan'}</p>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 italic">
                                        <Clock size={14} />
                                        Since {new Date(selectedProject?.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 p-6 bg-orange-500/10 rounded-[32px] border border-orange-500/20">
                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2 italic">Infrastructure Priority</p>
                                <p className="text-sm font-bold text-slate-300">Upgrade to Pro for enterprise-grade uptime, DDoS protection, and global CDN delivery.</p>
                            </div>
                        </div>

                        {/* Right: Modern Pricing Grid */}
                        <div className="lg:w-3/4 p-12 overflow-y-auto bg-slate-50/50">
                            <div className="max-w-4xl mx-auto">
                                <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tight mb-2">
                                    {(selectedProject?.name.toLowerCase().includes('hosting') || (selectedProject?.package && selectedProject?.package.toLowerCase().includes('hosting')))
                                        ? 'Hosting Solutions'
                                        : 'Management Services'}
                                </h3>
                                <p className="text-slate-500 font-medium mb-12">Select a strategic tier to optimize your digital infrastructure.</p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {((selectedProject?.name.toLowerCase().includes('hosting') || (selectedProject?.package && selectedProject?.package.toLowerCase().includes('hosting')))
                                        ? hostingPackages
                                        : managementPackages).map((pkg) => {
                                            const isCurrent = (selectedProject?.package || '') === pkg.name;
                                            const isPro = pkg.name.includes('Pro');

                                            return (
                                                <div
                                                    key={pkg.name}
                                                    className={`flex flex-col bg-white p-8 rounded-[48px] border-2 transition-all relative group ${isCurrent
                                                            ? 'border-orange-500 shadow-2xl shadow-orange-500/10 scale-105 z-10'
                                                            : 'border-white hover:border-orange-200 shadow-sm'
                                                        }`}
                                                >
                                                    {isPro && (
                                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-2 rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-xl">Recommended</div>
                                                    )}

                                                    <div className="mb-8">
                                                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{pkg.name}</h4>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-xs font-black text-slate-400">USD</span>
                                                            <span className="text-4xl font-black text-slate-900 tracking-tighter">{pkg.price}</span>
                                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">/M</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 space-y-4 mb-10">
                                                        {(Array.isArray(pkg.features) ? pkg.features : []).map((f: any, i: number) => (
                                                            <div key={i} className={`flex items-start gap-3 text-[10px] font-bold ${f.included ? 'text-slate-700' : 'text-slate-300'}`}>
                                                                {f.included ? (
                                                                    <Check size={14} className="text-green-500 mt-0.5 shrink-0" />
                                                                ) : (
                                                                    <Minus size={14} className="text-slate-200 mt-0.5 shrink-0" />
                                                                )}
                                                                <span className={f.included ? '' : 'line-through decoration-slate-200'}>{f.text}</span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {!isCurrent ? (
                                                        <button
                                                            disabled={upgrading}
                                                            onClick={() => handleUpgrade(pkg.name)}
                                                            className="w-full py-4 bg-slate-900 hover:bg-orange-600 text-white rounded-[24px] font-black uppercase tracking-widest text-[9px] transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
                                                        >
                                                            {upgrading ? <Loader2 className="animate-spin" size={14} /> : 'Deploy Service'}
                                                        </button>
                                                    ) : (
                                                        <div className="w-full py-4 bg-orange-50 text-orange-600 rounded-[24px] font-black uppercase tracking-widest text-[9px] text-center border border-orange-100 flex items-center justify-center gap-2">
                                                            Active <Check size={14} />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


