'use client';

import { useState, useEffect } from 'react';
import { 
    Package, 
    Globe, 
    Server, 
    ArrowUpRight, 
    Check, 
    Minus, 
    X, 
    Loader2, 
    Shield, 
    Clock,
    Zap,
    Activity,
    ShieldCheck
} from 'lucide-react';
import api from '@/lib/api';

export default function ClientServicesPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [upgrading, setUpgrading] = useState(false);

    const [managementPackages, setManagementPackages] = useState<any[]>([]);
    const [hostingPackages, setHostingPackages] = useState<any[]>([]);

    useEffect(() => {
        fetchProjects();
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const response = await api.get('/packages');
            const data = response.data;
            setHostingPackages(data.filter((pkg: any) => pkg.type === 'hosting'));
            setManagementPackages(data.filter((pkg: any) => pkg.type === 'management'));
        } catch (error) {
            console.error('Failed to fetch packages', error);
        }
    };

    const fetchProjects = async () => {
        try {
            const response = await api.get('/dashboard');
            setProjects(response.data.projects || []);
        } catch (error) {
            console.error('Failed to fetch services', error);
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
                window.location.href = `/client/invoices`;
            } else {
                fetchProjects();
                alert(`Service upgraded to ${packageName} successfully.`);
            }
        } catch (error) {
            console.error('Upgrade failed', error);
            alert('Upgrade failed. Please contact support.');
        } finally {
            setUpgrading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[600px] flex flex-col items-center justify-center text-slate-400 gap-4">
                <Loader2 className="animate-spin text-orange-500" size={60} />
                <p className="font-black tracking-widest uppercase text-[10px]">Accessing Service Hub...</p>
            </div>
        );
    }

    const isWebsiteOrder = (p: any) => {
        const name = String(p?.name || '').toLowerCase();
        const pkg = String(p?.package || '').toLowerCase();
        return name.startsWith('website order -') || pkg.includes('website');
    };

    const hostingServices = projects.filter(p => p.name.toLowerCase().includes('hosting') || (p.package && p.package.toLowerCase().includes('hosting')));
    const websiteServices = projects
        .filter(isWebsiteOrder)
        .filter(p => {
            const approvalStatus = String(p?.approval_status || '').toLowerCase();
            const projectStatus = String(p?.status || '').toLowerCase();
            return approvalStatus === 'approved' || (!approvalStatus && !['pending', 'cancelled'].includes(projectStatus));
        });
    const managementServices = projects.filter(p => !hostingServices.includes(p) && !isWebsiteOrder(p));

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            <div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase">My Services</h1>
                <p className="text-slate-500 mt-2 font-medium text-lg italic">Manage your digital infrastructure and service tiers.</p>
            </div>

            {/* Hosting Section */}
            <section className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <Globe size={24} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Website Hosting Services</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {hostingServices.length > 0 ? hostingServices.map((service) => (
                        <ServiceCard 
                            key={service.id} 
                            service={service} 
                            type="Hosting"
                            onUpgrade={() => {
                                setSelectedProject(service);
                                setShowUpgradeModal(true);
                            }}
                        />
                    )) : (
                        <div className="col-span-full py-20 bg-white border border-slate-100 border-dashed rounded-[48px] text-center">
                            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No active hosting services detected.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Website Section */}
            <section className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <Package size={24} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Website Orders</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {websiteServices.length > 0 ? websiteServices.map((service) => (
                        <ServiceCard
                            key={service.id}
                            service={service}
                            type="Website"
                            onUpgrade={() => {
                                setSelectedProject(service);
                                setShowUpgradeModal(true);
                            }}
                        />
                    )) : (
                        <div className="col-span-full py-20 bg-white border border-slate-100 border-dashed rounded-[48px] text-center">
                            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No approved website orders detected.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Management Section */}
            <section className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <Server size={24} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Website Management Services</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {managementServices.length > 0 ? managementServices.map((service) => (
                        <ServiceCard 
                            key={service.id} 
                            service={service} 
                            type="Management"
                            onUpgrade={() => {
                                setSelectedProject(service);
                                setShowUpgradeModal(true);
                            }}
                        />
                    )) : (
                        <div className="col-span-full py-20 bg-white border border-slate-100 border-dashed rounded-[48px] text-center">
                            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No active management services detected.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Upgrade Modal */}
            {showUpgradeModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
                    <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[64px] shadow-2xl relative overflow-hidden flex flex-col lg:flex-row">
                        <button 
                            onClick={() => setShowUpgradeModal(false)}
                            className="absolute top-8 right-8 z-20 w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all shadow-sm"
                        >
                            <X size={24} />
                        </button>

                        {/* Current Service Context */}
                        <div className="lg:w-1/4 bg-slate-900 p-12 text-white">
                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-12">Deployment Status</h3>
                            <div className="space-y-8">
                                <div className="p-6 bg-white/5 rounded-[32px] border border-white/10">
                                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">{selectedProject?.name}</p>
                                    <p className="text-xl font-black leading-tight mb-4">{selectedProject?.package || 'Starter Plan'}</p>
                                    <span className="text-[10px] font-black uppercase bg-green-500/20 text-green-400 px-3 py-1 rounded-full">Active</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                                        <Zap size={16} className="text-orange-500" /> Instant Activation
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                                        <Activity size={16} className="text-blue-500" /> Automated Provisioning
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                                        <ShieldCheck size={16} className="text-green-500" /> Secure Encryption
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Package Selection */}
                        <div className="lg:w-3/4 p-12 overflow-y-auto bg-slate-50/50">
                            <div className="max-w-4xl mx-auto text-center mb-12">
                                <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tight mb-2">Upgrade Service Tier</h3>
                                <p className="text-slate-500 font-medium italic">Selecting a new tier will automatically update your active package. No admin approval required.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {(selectedProject?.name.toLowerCase().includes('hosting') || (selectedProject?.package && selectedProject?.package.toLowerCase().includes('hosting')) 
                                    ? hostingPackages 
                                    : managementPackages).map((pkg) => {
                                    const isCurrent = (selectedProject?.package || '') === pkg.name;
                                    return (
                                        <div 
                                            key={pkg.name}
                                            className={`flex flex-col bg-white p-8 rounded-[48px] border-2 transition-all relative ${
                                                isCurrent ? 'border-orange-500 shadow-2xl shadow-orange-500/10' : 'border-white'
                                            }`}
                                        >
                                            <div className="mb-8">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{pkg.name}</h4>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-[10px] font-black text-slate-400">USD</span>
                                                    <span className="text-3xl font-black text-slate-900 tracking-tighter">{pkg.price}</span>
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase">/M</span>
                                                </div>
                                            </div>

                                            <div className="flex-1 space-y-4 mb-10">
                                                {(Array.isArray(pkg.features) ? pkg.features : []).map((f: any, i: number) => (
                                                    <div key={i} className={`flex items-start gap-2 text-[9px] font-bold ${f.included ? 'text-slate-700' : 'text-slate-300'}`}>
                                                        {f.included ? <Check size={12} className="text-green-500 shrink-0 mt-0.5" /> : <Minus size={12} className="text-slate-200 shrink-0 mt-0.5" />}
                                                        <span className={f.included ? '' : 'line-through decoration-slate-100'}>{f.text}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {!isCurrent ? (
                                                <button 
                                                    disabled={upgrading}
                                                    onClick={() => handleUpgrade(pkg.name)}
                                                    className="w-full py-4 bg-slate-900 hover:bg-orange-600 text-white rounded-[24px] font-black uppercase tracking-widest text-[8px] transition-all"
                                                >
                                                    {upgrading ? <Loader2 className="animate-spin mx-auto" size={12} /> : 'Instant Upgrade'}
                                                </button>
                                            ) : (
                                                <div className="w-full py-4 bg-orange-50 text-orange-600 rounded-[24px] font-black uppercase tracking-widest text-[8px] text-center border border-orange-100">
                                                    Current Plan
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ServiceCard({ service, type, onUpgrade }: any) {
    const isHosting = type === 'Hosting';
    const isWebsite = type === 'Website';
    return (
        <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-orange-500/30 transition-all">
            <div className={`absolute top-0 right-0 w-32 h-32 ${isWebsite ? 'bg-green-500' : isHosting ? 'bg-blue-500' : 'bg-orange-500'} opacity-5 rounded-full -mr-16 -mt-16 blur-2xl`}></div>
            
            <div className="flex justify-between items-start mb-8 relative z-10">
                <div className={`w-14 h-14 ${isWebsite ? 'bg-green-50 text-green-600' : isHosting ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'} rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-sm`}>
                    {isWebsite ? <Package size={28} /> : isHosting ? <Globe size={28} /> : <Server size={28} />}
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className="px-4 py-2 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">{service.status}</span>
                </div>
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-2 relative z-10">{service.name}</h3>
            <div className="flex items-center gap-2 mb-10 relative z-10">
                <div className={`px-3 py-1 ${isWebsite ? 'bg-green-50 text-green-600 border-green-100' : isHosting ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'} rounded-lg text-[9px] font-black uppercase tracking-widest border`}>
                    {service.package || `Starter ${type}`}
                </div>
            </div>

            <div className="pt-8 border-t border-slate-50 grid grid-cols-2 gap-4 relative z-10">
                <div>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Renewal Date</p>
                    <p className="text-xs font-black text-slate-900 flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        {service.deadline || 'Q3 2026'}
                    </p>
                </div>
                <div className="flex items-end justify-end">
                    {isWebsite ? (
                        <button
                            onClick={() => window.location.href = '/client/invoices'}
                            className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2"
                        >
                            Billing <ArrowUpRight size={14} />
                        </button>
                    ) : (
                        <button 
                            onClick={onUpgrade}
                            className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2"
                        >
                            Upgrade <ArrowUpRight size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
