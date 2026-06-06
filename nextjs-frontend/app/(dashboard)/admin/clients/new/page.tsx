'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    User,
    Globe,
    Server,
    Layout,
    CreditCard,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Shield,
    RefreshCw,
    Key,
    Mail,
    Loader2,
    ChevronLeft,
    AlertCircle,
    Package,
    Calculator,
    DollarSign
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

const steps = [
    { id: 'client', title: 'Identity', icon: User },
    { id: 'services', title: 'Service Selection', icon: Package },
    { id: 'pricing', title: 'Deal Pricing', icon: Calculator },
    { id: 'payment', title: 'Financials', icon: CreditCard },
    { id: 'access', title: 'Access', icon: Shield },
];

export default function AdminNewClientPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [agents, setAgents] = useState<any[]>([]);

    const [settings, setSettings] = useState({ vat: 0, tax: 0 });

    const [formData, setFormData] = useState({
        full_name: '', nic: '', address: '', company_name: '', email: '', phone: '', whatsapp: '',
        currency: 'USD',
        exchange_rate: 335,
        vat: '0',
        tax: '0',
        payment_status: 'pending',
        username: '', password: '', role: 'client', send_email: true,
        agent_id: '',
        services: {
            hosting: {
                selected: false,
                package_name: '',
                domain_name: '',
                original_price: 0,
                negotiated_price: 0
            },
            management: {
                selected: false,
                package_name: '',
                original_price: 0,
                negotiated_price: 0
            },
            development: {
                selected: false,
                project_name: '',
                project_description: '',
                original_price: 0,
                negotiated_price: 0,
                advance_payment: 0
            }
        }
    });

    const hostingPackages = [
        { name: 'Starter Package', price: 60.00 },
        { name: 'Light Package', price: 120.00 },
        { name: 'Pro Package', price: 200.00 }
    ];

    const managementPackages = [
        { name: 'Starter Package', price: 49.99 },
        { name: 'Light Package', price: 99.99 },
        { name: 'Pro Package', price: 149.90 }
    ];

    useEffect(() => {
        api.get('/settings/defaults').then(res => {
            const v = res.data.default_vat_percentage || 0;
            const t = res.data.default_tax_percentage || 0;
            setSettings({ vat: v, tax: t });
            setFormData(prev => ({ ...prev, vat: String(v), tax: String(t) }));
        }).catch(() => {});

        api.get('/agents').then(res => {
            setAgents(res.data);
        }).catch(() => {});

        api.get('/exchange-rate').then(res => {
            if (res.data?.rate && res.data.rate > 1) {
                setFormData(prev => ({ ...prev, exchange_rate: Number(res.data.rate) }));
            }
        }).catch(() => {});
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        });
        if (error) setError(null);
    };

    const handleServiceToggle = (serviceType: 'hosting' | 'management' | 'development') => {
        setFormData(prev => ({
            ...prev,
            services: {
                ...prev.services,
                [serviceType]: {
                    ...prev.services[serviceType],
                    selected: !prev.services[serviceType].selected
                }
            }
        }));
    };

    const handleServiceFieldChange = (serviceType: 'hosting' | 'management' | 'development', field: string, value: any) => {
        setFormData(prev => {
            const newServices: any = { ...prev.services };
            newServices[serviceType] = { ...newServices[serviceType], [field]: value };
            
            // Auto-update original price if package selected
            if (field === 'package_name') {
                if (serviceType === 'hosting') {
                    const pkg = hostingPackages.find(p => p.name === value);
                    if (pkg) {
                        newServices[serviceType].original_price = pkg.price;
                        if (!newServices[serviceType].negotiated_price) newServices[serviceType].negotiated_price = pkg.price;
                    }
                } else if (serviceType === 'management') {
                    const pkg = managementPackages.find(p => p.name === value);
                    if (pkg) {
                        newServices[serviceType].original_price = pkg.price;
                        if (!newServices[serviceType].negotiated_price) newServices[serviceType].negotiated_price = pkg.price;
                    }
                }
            }
            return { ...prev, services: newServices };
        });
    };

    const calculateTotals = () => {
        let totalUSD = 0;
        if (formData.services.hosting.selected) totalUSD += Number(formData.services.hosting.negotiated_price || formData.services.hosting.original_price);
        if (formData.services.management.selected) totalUSD += Number(formData.services.management.negotiated_price || formData.services.management.original_price);
        if (formData.services.development.selected) totalUSD += Number(formData.services.development.negotiated_price || formData.services.development.original_price);

        const vatAmt = (totalUSD * Number(formData.vat)) / 100;
        const taxAmt = (totalUSD * Number(formData.tax)) / 100;
        const grandTotalUSD = totalUSD + vatAmt + taxAmt;

        const convertedLKR = grandTotalUSD * formData.exchange_rate;

        return { totalUSD, vatAmt, taxAmt, grandTotalUSD, convertedLKR };
    };

    const totals = calculateTotals();

    const generateCredentials = () => {
        const namePart = formData.full_name.split(' ')[0].toLowerCase() || 'user';
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const generatedUsername = `${namePart}${randomNum}`;
        const generatedPassword = Math.random().toString(36).slice(-8) + '!' + Math.floor(Math.random() * 10);

        setFormData({
            ...formData,
            username: generatedUsername,
            password: generatedPassword
        });
    };

    const nextStep = (e: any) => {
        e.preventDefault();
        if (currentStep === 0 && (!formData.full_name || !formData.email)) {
            setError('Full name and email are required');
            return;
        }
        if (currentStep === 1 && !formData.services.hosting.selected && !formData.services.management.selected && !formData.services.development.selected) {
            setError('Please select at least one service to continue.');
            return;
        }
        if (currentStep === 3 && !formData.username) {
            generateCredentials();
        }
        setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
        setError(null);
    };

    const prevStep = (e: any) => {
        e.preventDefault();
        setCurrentStep(prev => Math.max(prev - 1, 0));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.password.trim()) {
            setError('Client portal password is required. Please enter or generate a password.');
            setCurrentStep(4);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await api.post('/clients', formData);
            router.push('/admin/clients');
        } catch (err: any) {
            console.error('Registration failed', err);
            const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
            setError(`Error: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in slide-in-from-bottom duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <Link href="/admin/clients" className="w-14 h-14 bg-white border border-slate-100 rounded-[20px] flex items-center justify-center text-slate-400 hover:text-orange-600 hover:border-orange-100 transition-all shadow-sm">
                        <ChevronLeft size={28} />
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Admin Onboarding</h1>
                        <p className="text-slate-500 mt-1 font-medium italic">Multi-service negotiator and unified billing</p>
                    </div>
                </div>
            </div>

            {/* Step Indicator */}
            <div className="flex justify-between items-center bg-white border border-slate-100 p-10 rounded-[48px] shadow-sm relative overflow-hidden">
                <div className="absolute top-1/2 left-20 right-20 h-[1px] bg-slate-100 -translate-y-1/2 z-0 hidden md:block"></div>
                {steps.map((step, index) => (
                    <div key={step.id} className="relative z-10 flex flex-col items-center gap-4 px-4">
                        <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-500 ${index <= currentStep ? 'orange-gradient text-white scale-110 shadow-2xl shadow-orange-500/20' : 'bg-slate-50 border border-slate-100 text-slate-300'}`}>
                            <step.icon size={28} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] hidden md:block ${index <= currentStep ? 'text-orange-600' : 'text-slate-400'}`}>{step.title}</span>
                    </div>
                ))}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 p-8 rounded-[32px] flex items-center gap-4 text-red-600 animate-in fade-in shadow-sm">
                    <AlertCircle size={24} />
                    <p className="font-black text-sm uppercase tracking-widest">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white border border-slate-100 p-16 rounded-[64px] shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 orange-gradient opacity-5 rounded-full -mr-48 -mt-48 blur-3xl pointer-events-none"></div>

                {/* STEP 1: IDENTITY */}
                {currentStep === 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="md:col-span-2 flex items-center gap-5 text-orange-600 mb-6 border-b border-slate-50 pb-8">
                            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center"><User size={32} /></div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Client Identity</h3>
                                <p className="text-sm font-medium text-slate-500 italic">Legal and contact information.</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Full Legal Name</label>
                            <input name="full_name" value={formData.full_name} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-[24px] py-5 px-8 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all shadow-sm" required />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Strategic Email</label>
                            <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-[24px] py-5 px-8 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all shadow-sm" required />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Phone Number</label>
                            <input name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-[24px] py-5 px-8 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all shadow-sm" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Business Entity</label>
                            <input name="company_name" value={formData.company_name} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-[24px] py-5 px-8 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all shadow-sm" />
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Assign Lead Agent (Optional)</label>
                            <select name="agent_id" value={formData.agent_id} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-[24px] py-5 px-8 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all appearance-none cursor-pointer shadow-sm">
                                <option value="">No Agent (Direct Lead)</option>
                                {agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                            </select>
                        </div>
                    </div>
                )}

                {/* STEP 2: SERVICE SELECTION */}
                {currentStep === 1 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="flex items-center gap-5 text-orange-600 mb-6 border-b border-slate-50 pb-8">
                            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center"><Package size={32} /></div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Service Bundle</h3>
                                <p className="text-sm font-medium text-slate-500 italic">Select and configure the client's architecture.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div onClick={() => handleServiceToggle('hosting')} className={`p-8 rounded-[32px] border-2 cursor-pointer transition-all ${formData.services.hosting.selected ? 'border-orange-500 bg-orange-50/50' : 'border-slate-100 bg-white hover:border-orange-200'}`}>
                                <Globe size={32} className={formData.services.hosting.selected ? 'text-orange-500' : 'text-slate-400'} />
                                <h4 className="mt-4 font-black text-slate-900 uppercase tracking-tight">Website Hosting</h4>
                                <p className="text-xs text-slate-500 mt-2 font-medium">Domain & Server management.</p>
                            </div>
                            <div onClick={() => handleServiceToggle('management')} className={`p-8 rounded-[32px] border-2 cursor-pointer transition-all ${formData.services.management.selected ? 'border-orange-500 bg-orange-50/50' : 'border-slate-100 bg-white hover:border-orange-200'}`}>
                                <Server size={32} className={formData.services.management.selected ? 'text-orange-500' : 'text-slate-400'} />
                                <h4 className="mt-4 font-black text-slate-900 uppercase tracking-tight">Website Management</h4>
                                <p className="text-xs text-slate-500 mt-2 font-medium">Monthly updates & optimization.</p>
                            </div>
                            <div onClick={() => handleServiceToggle('development')} className={`p-8 rounded-[32px] border-2 cursor-pointer transition-all ${formData.services.development.selected ? 'border-orange-500 bg-orange-50/50' : 'border-slate-100 bg-white hover:border-orange-200'}`}>
                                <Layout size={32} className={formData.services.development.selected ? 'text-orange-500' : 'text-slate-400'} />
                                <h4 className="mt-4 font-black text-slate-900 uppercase tracking-tight">Project Development</h4>
                                <p className="text-xs text-slate-500 mt-2 font-medium">Custom website creation.</p>
                            </div>
                        </div>

                        <div className="space-y-6 mt-8">
                            {formData.services.hosting.selected && (
                                <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px] space-y-4">
                                    <h4 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest text-xs"><Globe size={18} className="text-orange-500" /> Hosting Configuration</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input placeholder="Domain Name (e.g. example.com)" value={formData.services.hosting.domain_name} onChange={(e) => handleServiceFieldChange('hosting', 'domain_name', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-4 px-6 outline-none font-bold" />
                                        <select value={formData.services.hosting.package_name} onChange={(e) => handleServiceFieldChange('hosting', 'package_name', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-4 px-6 outline-none font-bold">
                                            <option value="">Select Package</option>
                                            {hostingPackages.map(p => <option key={p.name} value={p.name}>{p.name} (${p.price})</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {formData.services.management.selected && (
                                <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px] space-y-4">
                                    <h4 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest text-xs"><Server size={18} className="text-orange-500" /> Management Configuration</h4>
                                    <select value={formData.services.management.package_name} onChange={(e) => handleServiceFieldChange('management', 'package_name', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-4 px-6 outline-none font-bold">
                                        <option value="">Select Package</option>
                                        {managementPackages.map(p => <option key={p.name} value={p.name}>{p.name} (${p.price})</option>)}
                                    </select>
                                </div>
                            )}

                            {formData.services.development.selected && (
                                <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px] space-y-4">
                                    <h4 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest text-xs"><Layout size={18} className="text-orange-500" /> Development Configuration</h4>
                                    <input placeholder="Project Name" value={formData.services.development.project_name} onChange={(e) => handleServiceFieldChange('development', 'project_name', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-4 px-6 outline-none font-bold" />
                                    <textarea placeholder="Expected Features & Description" rows={3} value={formData.services.development.project_description} onChange={(e) => handleServiceFieldChange('development', 'project_description', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-4 px-6 outline-none resize-none font-bold"></textarea>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 3: PRICING OVERRIDE */}
                {currentStep === 2 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="flex items-center gap-5 text-orange-600 mb-6 border-b border-slate-50 pb-8">
                            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center"><Calculator size={32} /></div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Admin Price Override</h3>
                                <p className="text-sm font-medium text-slate-500 italic">Adjust standard package prices for this client.</p>
                            </div>
                        </div>

                        {formData.services.hosting.selected && (
                            <div className="flex items-center justify-between p-8 bg-slate-50 border border-slate-100 rounded-[32px] shadow-sm">
                                <div>
                                    <p className="font-black text-slate-900 uppercase tracking-widest text-sm">Hosting Service</p>
                                    <p className="text-xs text-slate-500 font-bold mt-1">Base Price: ${formData.services.hosting.original_price}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-400 font-black">USD $</span>
                                    <input type="number" value={formData.services.hosting.negotiated_price} onChange={(e) => handleServiceFieldChange('hosting', 'negotiated_price', e.target.value)} className="w-40 bg-white border border-orange-200 focus:border-orange-500 rounded-2xl py-3 px-6 text-right font-black text-orange-600 outline-none shadow-sm transition-all" />
                                </div>
                            </div>
                        )}

                        {formData.services.management.selected && (
                            <div className="flex items-center justify-between p-8 bg-slate-50 border border-slate-100 rounded-[32px] shadow-sm">
                                <div>
                                    <p className="font-black text-slate-900 uppercase tracking-widest text-sm">Management Service</p>
                                    <p className="text-xs text-slate-500 font-bold mt-1">Base Price: ${formData.services.management.original_price}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-400 font-black">USD $</span>
                                    <input type="number" value={formData.services.management.negotiated_price} onChange={(e) => handleServiceFieldChange('management', 'negotiated_price', e.target.value)} className="w-40 bg-white border border-orange-200 focus:border-orange-500 rounded-2xl py-3 px-6 text-right font-black text-orange-600 outline-none shadow-sm transition-all" />
                                </div>
                            </div>
                        )}

                        {formData.services.development.selected && (
                            <div className="flex items-center justify-between p-8 bg-slate-50 border border-slate-100 rounded-[32px] shadow-sm">
                                <div>
                                    <p className="font-black text-slate-900 uppercase tracking-widest text-sm">Custom Development</p>
                                    <p className="text-xs text-slate-500 font-bold mt-1">Manual Quote Required</p>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-end gap-3">
                                        <span className="text-slate-400 text-[10px] uppercase font-black">Original $</span>
                                        <input type="number" value={formData.services.development.original_price} onChange={(e) => handleServiceFieldChange('development', 'original_price', e.target.value)} className="w-40 bg-white border border-slate-200 rounded-2xl py-2 px-4 text-right font-black text-slate-600 outline-none shadow-sm" />
                                    </div>
                                    <div className="flex items-center justify-end gap-3">
                                        <span className="text-orange-500 text-[10px] uppercase font-black">Final $</span>
                                        <input type="number" value={formData.services.development.negotiated_price} onChange={(e) => handleServiceFieldChange('development', 'negotiated_price', e.target.value)} className="w-40 bg-white border border-orange-200 focus:border-orange-500 rounded-2xl py-3 px-4 text-right font-black text-orange-600 outline-none shadow-sm transition-all" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 4: FINANCIALS & CURRENCY */}
                {currentStep === 3 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                            <div className="flex items-center gap-5 text-orange-600">
                                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center"><DollarSign size={32} /></div>
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Billing & Settlement</h3>
                                    <p className="text-sm font-medium text-slate-500 italic">Configure currency and tax logic.</p>
                                </div>
                            </div>
                            <div className="flex bg-slate-50 p-2 rounded-2xl shadow-inner">
                                <button type="button" onClick={() => setFormData({...formData, currency: 'USD'})} className={`px-8 py-3 rounded-xl font-black text-xs transition-all ${formData.currency === 'USD' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>USD Billing</button>
                                <button type="button" onClick={() => setFormData({...formData, currency: 'LKR'})} className={`px-8 py-3 rounded-xl font-black text-xs transition-all ${formData.currency === 'LKR' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>LKR Billing</button>
                            </div>
                        </div>

                        {formData.currency === 'LKR' && (
                            <div className="flex items-center justify-between p-8 bg-blue-50 border border-blue-100 rounded-[32px] shadow-sm">
                                <p className="font-black text-blue-900 text-sm uppercase tracking-widest">Active Exchange Rate (LKR)</p>
                                <div className="flex items-center gap-3">
                                    <span className="text-blue-400 font-black">1 USD =</span>
                                    <input type="number" value={formData.exchange_rate} onChange={(e) => setFormData({...formData, exchange_rate: Number(e.target.value)})} className="w-40 bg-white border border-blue-200 rounded-2xl py-3 px-6 text-right font-black text-blue-600 outline-none shadow-sm" />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Override VAT %</label>
                                <input name="vat" type="number" step="0.01" value={formData.vat} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-[24px] py-4 px-6 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 outline-none shadow-sm" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Override Tax %</label>
                                <input name="tax" type="number" step="0.01" value={formData.tax} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-[24px] py-4 px-6 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 outline-none shadow-sm" />
                            </div>
                        </div>

                        <div className="bg-orange-50 p-10 rounded-[40px] border border-orange-100 space-y-6 shadow-sm">
                            <div className="flex justify-between text-sm">
                                <span className="font-bold text-slate-500 uppercase tracking-widest">Base Services (USD)</span>
                                <span className="font-black text-slate-900">${totals.totalUSD.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="font-bold text-slate-500 uppercase tracking-widest">VAT & Tax</span>
                                <span className="font-black text-slate-900">${(totals.vatAmt + totals.taxAmt).toFixed(2)}</span>
                            </div>
                            <div className="pt-6 border-t border-orange-200 flex justify-between items-center">
                                <span className="font-black text-orange-600 uppercase tracking-[0.2em] text-sm">Final Invoice Quote</span>
                                <div className="text-right">
                                    {formData.currency === 'LKR' ? (
                                        <>
                                            <p className="text-4xl font-black text-orange-600">Rs. {totals.convertedLKR.toLocaleString()}</p>
                                            <p className="text-sm font-bold text-slate-400 mt-1">${totals.grandTotalUSD.toFixed(2)} Base</p>
                                        </>
                                    ) : (
                                        <p className="text-4xl font-black text-orange-600">${totals.grandTotalUSD.toLocaleString()}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 5: ACCESS */}
                {currentStep === 4 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="flex items-center gap-5 text-orange-600 mb-6 border-b border-slate-50 pb-8">
                            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center"><Shield size={32} /></div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Secure Portal Access</h3>
                                <p className="text-sm font-medium text-slate-500 italic">Generate secure access for the client dashboard.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-slate-50 p-12 rounded-[48px] border border-slate-100 shadow-inner">
                            <div className="space-y-3 relative">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Strategic Username</label>
                                <div className="relative">
                                    <input name="username" value={formData.username} onChange={handleChange} className="w-full bg-white border border-slate-100 rounded-[20px] py-5 px-8 text-slate-900 font-black focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-mono shadow-sm" />
                                    <User className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200" size={20} />
                                </div>
                            </div>
                            <div className="space-y-3 relative">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Access Key</label>
                                <div className="relative">
                                    <input name="password" type="text" required value={formData.password} onChange={handleChange} className="w-full bg-white border border-slate-100 rounded-[20px] py-5 px-8 text-slate-900 font-black focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-mono shadow-sm" />
                                    <Key className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200" size={20} />
                                </div>
                                {!formData.password.trim() && (
                                    <p className="text-red-500 text-[10px] font-black uppercase tracking-widest ml-2">
                                        Password required for client login
                                    </p>
                                )}
                            </div>
                            <div className="md:col-span-2 flex justify-center">
                                <button type="button" onClick={generateCredentials} className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl">
                                    <RefreshCw size={18} /> Generate Secure Credentials
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 p-10 bg-orange-50 border border-orange-100 rounded-[32px] shadow-sm">
                            <div className="w-16 h-16 bg-white border border-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm"><Mail size={32} /></div>
                            <div className="flex-1">
                                <h4 className="text-slate-900 font-black text-sm uppercase tracking-wider">Send Dispatch Email</h4>
                                <p className="text-slate-500 text-xs mt-1 font-medium italic">Credentials will be dispatched to {formData.email || 'the primary contact'}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" name="send_email" checked={formData.send_email} onChange={handleChange} className="sr-only peer" />
                                <div className="w-16 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-600 shadow-inner"></div>
                            </label>
                        </div>
                    </div>
                )}

                <div className="mt-16 pt-10 border-t border-slate-50 flex justify-between items-center relative z-10">
                    <button type="button" onClick={prevStep} disabled={currentStep === 0} className={`flex items-center gap-3 px-10 py-5 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${currentStep === 0 ? 'opacity-0 disabled:cursor-not-allowed' : 'text-slate-400 hover:text-orange-600 hover:bg-orange-50'}`}>
                        <ArrowLeft size={22} /> Strategic Back
                    </button>

                    {currentStep < steps.length - 1 ? (
                        <button type="button" onClick={nextStep} className="flex items-center gap-3 px-12 py-5 orange-gradient text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-orange-500/30">
                            Next Step <ArrowRight size={22} />
                        </button>
                    ) : (
                        <button type="submit" disabled={loading} className="flex items-center gap-3 px-16 py-5 orange-gradient text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-orange-500/30 disabled:opacity-50">
                            {loading ? <><Loader2 className="animate-spin" size={22} /> Establishing Account...</> : <><CheckCircle2 size={22} /> Complete Onboarding</>}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
