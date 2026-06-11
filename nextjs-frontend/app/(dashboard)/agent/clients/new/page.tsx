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
    Loader2,
    AlertCircle,
    ChevronLeft,
    DollarSign,
    Calculator,
    Package
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

const steps = [
    { id: 'client', title: 'Identity', icon: User },
    { id: 'services', title: 'Service Selection', icon: Package },
    { id: 'pricing', title: 'Negotiated Pricing', icon: Calculator },
    { id: 'payment', title: 'Financials', icon: CreditCard },
];

export default function AgentNewClientPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [settings, setSettings] = useState({ vat: 0, tax: 0 });

    const [formData, setFormData] = useState({
        full_name: '', nic: '', address: '', company_name: '', email: '', phone: '', whatsapp: '',
        currency: 'USD',
        exchange_rate: 335, // Default for LKR conversion
        vat: '0',
        tax: '0',
        role: 'client',
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

    // Package Catalogs (In USD)
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
        });

        api.get('/exchange-rate').then(res => {
            if (res.data?.rate && res.data.rate > 1) {
                setFormData(prev => ({ ...prev, exchange_rate: Number(res.data.rate) }));
            }
        }).catch(() => {});
    }, []);

    const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
            
            // Auto-sync negotiated price with original price for agents (since they cannot negotiate)
            if (serviceType === 'development' && field === 'original_price') {
                newServices[serviceType].negotiated_price = value;
            }

            return { ...prev, services: newServices };
        });
    };

    // Calculations
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
        setLoading(true);
        setError(null);
        try {
            const totals = calculateTotals();
            const payload = {
                ...formData,
                total_value: totals.convertedLKR
            };
            await api.post('/clients', payload);
            router.push('/agent/clients');
        } catch (err: any) {
            console.error('Registration failed', err);
            setError(`Error: ${err.response?.data?.error || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-in slide-in-from-bottom duration-700 pb-20 px-2 sm:px-0">
            <div className="flex items-center gap-4 sm:gap-6">
                <Link href="/agent/clients" className="w-10 h-10 sm:w-14 sm:h-14 bg-white border border-slate-100 rounded-[14px] sm:rounded-[20px] flex items-center justify-center text-slate-400 hover:text-orange-600 hover:border-orange-100 transition-all shadow-sm shrink-0">
                    <ChevronLeft size={20} className="sm:size-[28px]" />
                </Link>
                <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">Deal & Registration Hub</h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Multi-service negotiator and client onboarding.</p>
                </div>
            </div>

            <div className="flex justify-between items-center bg-white border border-slate-100 p-4 sm:p-8 rounded-[20px] sm:rounded-[32px] shadow-sm relative gap-2">
                <div className="absolute top-1/2 left-10 right-10 h-[2px] bg-slate-100 -translate-y-1/2 z-0 hidden md:block"></div>
                {steps.map((step, index) => (
                    <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 sm:gap-3 px-1 sm:px-4">
                        <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-[12px] sm:rounded-[18px] flex items-center justify-center transition-all duration-500 ${index <= currentStep ? 'bg-orange-gradient text-white scale-110 shadow-lg' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                            <step.icon size={18} className="sm:size-[24px]" />
                        </div>
                        <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] hidden md:block ${index <= currentStep ? 'text-orange-500' : 'text-slate-400'}`}>{step.title}</span>
                    </div>
                ))}
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 sm:p-6 rounded-[20px] sm:rounded-3xl flex items-center gap-3 sm:gap-4 text-red-500 animate-in fade-in">
                    <AlertCircle size={20} className="sm:size-[24px] shrink-0" />
                    <p className="font-bold text-xs sm:text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white border border-slate-100 p-6 sm:p-12 rounded-[24px] sm:rounded-[48px] shadow-sm relative overflow-hidden">
                
                {/* STEP 1: IDENTITY */}
                {currentStep === 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="sm:col-span-2 flex items-center gap-3 sm:gap-4 text-orange-500 mb-2 sm:mb-4 border-b border-slate-50 pb-4 sm:pb-6">
                            <User size={24} className="sm:size-[32px] shrink-0" />
                            <div>
                                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Client Identity</h3>
                                <p className="text-xs sm:text-sm text-slate-500">Legal and contact information.</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                            <input name="full_name" value={formData.full_name} onChange={handleBasicChange} className="w-full bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl py-3 sm:py-5 px-4 sm:px-8 text-sm sm:text-base text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Official Email</label>
                            <input name="email" type="email" value={formData.email} onChange={handleBasicChange} className="w-full bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl py-3 sm:py-5 px-4 sm:px-8 text-sm sm:text-base text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                            <input name="phone" value={formData.phone} onChange={handleBasicChange} className="w-full bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl py-3 sm:py-5 px-4 sm:px-8 text-sm sm:text-base text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Business Entity</label>
                            <input name="company_name" value={formData.company_name} onChange={handleBasicChange} className="w-full bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl py-3 sm:py-5 px-4 sm:px-8 text-sm sm:text-base text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all" />
                        </div>
                    </div>
                )}

                {/* STEP 2: SERVICE SELECTION */}
                {currentStep === 1 && (
                    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="flex items-center gap-3 sm:gap-4 text-orange-500 mb-2 sm:mb-4 border-b border-slate-50 pb-4 sm:pb-6">
                            <Package size={24} className="sm:size-[32px] shrink-0" />
                            <div>
                                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Service Bundle</h3>
                                <p className="text-xs sm:text-sm text-slate-500">Select one or more services for this client.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                            {/* Hosting Toggle */}
                            <div 
                                onClick={() => handleServiceToggle('hosting')}
                                className={`p-6 sm:p-8 rounded-[20px] sm:rounded-[32px] border-2 cursor-pointer transition-all ${formData.services.hosting.selected ? 'border-orange-500 bg-orange-50/50' : 'border-slate-100 bg-white hover:border-orange-200'}`}
                            >
                                <Globe size={28} className={formData.services.hosting.selected ? 'text-orange-500' : 'text-slate-400'} />
                                <h4 className="mt-3 sm:mt-4 font-black text-slate-900 text-base sm:text-lg">Website Hosting</h4>
                                <p className="text-[11px] sm:text-xs text-slate-500 mt-1 sm:mt-2 font-medium">Domain & Server management.</p>
                            </div>

                            {/* Management Toggle */}
                            <div 
                                onClick={() => handleServiceToggle('management')}
                                className={`p-6 sm:p-8 rounded-[20px] sm:rounded-[32px] border-2 cursor-pointer transition-all ${formData.services.management.selected ? 'border-orange-500 bg-orange-50/50' : 'border-slate-100 bg-white hover:border-orange-200'}`}
                            >
                                <Server size={28} className={formData.services.management.selected ? 'text-orange-500' : 'text-slate-400'} />
                                <h4 className="mt-3 sm:mt-4 font-black text-slate-900 text-base sm:text-lg">Website Management</h4>
                                <p className="text-[11px] sm:text-xs text-slate-500 mt-1 sm:mt-2 font-medium">Monthly updates & optimization.</p>
                            </div>

                            {/* Development Toggle */}
                            <div 
                                onClick={() => handleServiceToggle('development')}
                                className={`p-6 sm:p-8 rounded-[20px] sm:rounded-[32px] border-2 cursor-pointer transition-all ${formData.services.development.selected ? 'border-orange-500 bg-orange-50/50' : 'border-slate-100 bg-white hover:border-orange-200'}`}
                            >
                                <Layout size={28} className={formData.services.development.selected ? 'text-orange-500' : 'text-slate-400'} />
                                <h4 className="mt-3 sm:mt-4 font-black text-slate-900 text-base sm:text-lg">Project Development</h4>
                                <p className="text-[11px] sm:text-xs text-slate-500 mt-1 sm:mt-2 font-medium">Custom website creation.</p>
                            </div>
                        </div>

                        {/* Setup Selected Services */}
                        <div className="space-y-4 sm:space-y-6 mt-6 sm:mt-8">
                            {formData.services.hosting.selected && (
                                <div className="p-6 sm:p-8 bg-slate-50 border border-slate-100 rounded-[20px] sm:rounded-[32px] space-y-4">
                                    <h4 className="font-black text-slate-900 flex items-center gap-2"><Globe size={16} className="text-orange-500" /> Hosting Details</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <input placeholder="Domain Name (e.g. example.com)" value={formData.services.hosting.domain_name} onChange={(e) => handleServiceFieldChange('hosting', 'domain_name', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none text-sm" />
                                        <select value={formData.services.hosting.package_name} onChange={(e) => handleServiceFieldChange('hosting', 'package_name', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none text-sm">
                                            <option value="">Select Package</option>
                                            {hostingPackages.map(p => <option key={p.name} value={p.name}>{p.name} (${p.price})</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {formData.services.management.selected && (
                                <div className="p-6 sm:p-8 bg-slate-50 border border-slate-100 rounded-[20px] sm:rounded-[32px] space-y-4">
                                    <h4 className="font-black text-slate-900 flex items-center gap-2"><Server size={16} className="text-orange-500" /> Management Details</h4>
                                    <select value={formData.services.management.package_name} onChange={(e) => handleServiceFieldChange('management', 'package_name', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none text-sm">
                                        <option value="">Select Package</option>
                                        {managementPackages.map(p => <option key={p.name} value={p.name}>{p.name} (${p.price})</option>)}
                                    </select>
                                </div>
                            )}

                            {formData.services.development.selected && (
                                <div className="p-6 sm:p-8 bg-slate-50 border border-slate-100 rounded-[20px] sm:rounded-[32px] space-y-4">
                                    <h4 className="font-black text-slate-900 flex items-center gap-2"><Layout size={16} className="text-orange-500" /> Development Details</h4>
                                    <input placeholder="Project Name" value={formData.services.development.project_name} onChange={(e) => handleServiceFieldChange('development', 'project_name', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none text-sm" />
                                    <textarea placeholder="Expected Features & Description" rows={3} value={formData.services.development.project_description} onChange={(e) => handleServiceFieldChange('development', 'project_description', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none resize-none text-sm"></textarea>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 3: NEGOTIATED PRICING */}
                {currentStep === 2 && (
                    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="flex items-center gap-3 sm:gap-4 text-orange-500 mb-2 sm:mb-4 border-b border-slate-50 pb-4 sm:pb-6">
                            <Calculator size={24} className="sm:size-[32px] shrink-0" />
                            <div>
                                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Deal Pricing (USD)</h3>
                                <p className="text-xs sm:text-sm text-slate-500">Standard package prices apply. <span className="text-orange-500 font-bold">Only Admins can negotiate or override prices during approval.</span></p>
                            </div>
                        </div>

                        {formData.services.hosting.selected && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 bg-slate-50 border border-slate-100 rounded-[20px] sm:rounded-[24px] gap-3">
                                <div>
                                    <p className="font-black text-slate-900 text-sm sm:text-base">Hosting</p>
                                    <p className="text-xs text-slate-500">Standard: ${formData.services.hosting.original_price}</p>
                                </div>
                                <div className="flex items-center gap-2 opacity-50 cursor-not-allowed" title="Only Admin can negotiate">
                                    <span className="text-slate-400 font-black text-sm">$</span>
                                    <input type="number" disabled value={formData.services.hosting.negotiated_price} className="w-28 sm:w-32 bg-slate-100 border border-slate-200 rounded-xl py-2 px-3 sm:px-4 text-right font-black text-slate-500 outline-none cursor-not-allowed text-sm" />
                                </div>
                            </div>
                        )}

                        {formData.services.management.selected && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 bg-slate-50 border border-slate-100 rounded-[20px] sm:rounded-[24px] gap-3">
                                <div>
                                    <p className="font-black text-slate-900 text-sm sm:text-base">Management</p>
                                    <p className="text-xs text-slate-500">Standard: ${formData.services.management.original_price}</p>
                                </div>
                                <div className="flex items-center gap-2 opacity-50 cursor-not-allowed" title="Only Admin can negotiate">
                                    <span className="text-slate-400 font-black text-sm">$</span>
                                    <input type="number" disabled value={formData.services.management.negotiated_price} className="w-28 sm:w-32 bg-slate-100 border border-slate-200 rounded-xl py-2 px-3 sm:px-4 text-right font-black text-slate-500 outline-none cursor-not-allowed text-sm" />
                                </div>
                            </div>
                        )}

                        {formData.services.development.selected && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 bg-slate-50 border border-slate-100 rounded-[20px] sm:rounded-[24px] gap-3">
                                <div>
                                    <p className="font-black text-slate-900 text-sm sm:text-base">Development</p>
                                    <p className="text-xs text-slate-500">Custom Project Estimate</p>
                                </div>
                                <div className="flex flex-col gap-2 self-start sm:self-auto">
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400 text-[10px] uppercase font-black">Original $</span>
                                        <input type="number" value={formData.services.development.original_price} onChange={(e) => handleServiceFieldChange('development', 'original_price', e.target.value)} className="w-28 sm:w-32 bg-white border border-slate-200 rounded-xl py-2 px-3 sm:px-4 text-right font-black text-slate-600 outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-sm" />
                                    </div>
                                    <div className="flex items-center gap-2 opacity-50 cursor-not-allowed" title="Only Admin can negotiate">
                                        <span className="text-orange-500 text-[10px] uppercase font-black">Final $</span>
                                        <input type="number" disabled value={formData.services.development.original_price} className="w-28 sm:w-32 bg-slate-100 border border-slate-200 rounded-xl py-2 px-3 sm:px-4 text-right font-black text-slate-500 outline-none cursor-not-allowed text-sm" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 4: FINANCIALS & CURRENCY */}
                {currentStep === 3 && (
                    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 pb-4 sm:pb-6 gap-3">
                            <div className="flex items-center gap-3 sm:gap-4 text-orange-500">
                                <DollarSign size={24} className="sm:size-[32px] shrink-0" />
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Final Settlement</h3>
                                    <p className="text-xs sm:text-sm text-slate-500">Currency conversion and totals.</p>
                                </div>
                            </div>
                            <div className="flex bg-slate-50 p-1 rounded-xl self-start sm:self-auto">
                                <button type="button" onClick={() => setFormData({...formData, currency: 'USD'})} className={`px-4 sm:px-6 py-2 rounded-lg font-black text-[10px] sm:text-xs transition-all ${formData.currency === 'USD' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>USD</button>
                                <button type="button" onClick={() => setFormData({...formData, currency: 'LKR'})} className={`px-4 sm:px-6 py-2 rounded-lg font-black text-[10px] sm:text-xs transition-all ${formData.currency === 'LKR' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>LKR</button>
                            </div>
                        </div>

                        {formData.currency === 'LKR' && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 bg-blue-50 border border-blue-100 rounded-[20px] sm:rounded-[24px] gap-2">
                                <p className="font-black text-blue-900 text-xs sm:text-sm">Exchange Rate (USD to LKR)</p>
                                <input type="number" value={formData.exchange_rate} onChange={(e) => setFormData({...formData, exchange_rate: Number(e.target.value)})} className="w-28 sm:w-32 bg-white border border-blue-200 rounded-xl py-2 px-3 sm:px-4 text-right font-black text-blue-600 outline-none text-sm" />
                            </div>
                        )}

                        <div className="bg-orange-50 p-6 sm:p-8 rounded-[20px] sm:rounded-[32px] border border-orange-100 space-y-4">
                            <div className="flex justify-between text-xs sm:text-sm">
                                <span className="font-bold text-slate-500">Total Services (USD)</span>
                                <span className="font-black text-slate-900">${totals.totalUSD.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs sm:text-sm">
                                <span className="font-bold text-slate-500">VAT & Tax</span>
                                <span className="font-black text-slate-900">${(totals.vatAmt + totals.taxAmt).toFixed(2)}</span>
                            </div>
                            <div className="pt-4 border-t border-orange-200 flex justify-between items-center">
                                <span className="font-black text-orange-600 uppercase tracking-widest text-[10px] sm:text-xs">Final Quote</span>
                                <div className="text-right">
                                    {formData.currency === 'LKR' ? (
                                        <>
                                            <p className="text-2xl sm:text-3xl font-black text-orange-600">Rs. {totals.convertedLKR.toLocaleString()}</p>
                                            <p className="text-[10px] font-bold text-slate-400">${totals.grandTotalUSD.toFixed(2)} Base</p>
                                        </>
                                    ) : (
                                        <p className="text-2xl sm:text-3xl font-black text-orange-600">${totals.grandTotalUSD.toLocaleString()}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-10 sm:mt-16 pt-6 sm:pt-10 border-t border-slate-100 flex justify-between items-center relative z-10 gap-4">
                    <button type="button" onClick={prevStep} disabled={currentStep === 0} className={`flex items-center gap-2 sm:gap-3 px-6 sm:px-10 py-3.5 sm:py-5 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest transition-all text-[10px] sm:text-xs ${currentStep === 0 ? 'opacity-0 disabled:cursor-not-allowed' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}>
                        <ArrowLeft size={16} className="sm:size-[22px]" /> Back
                    </button>

                    {currentStep < steps.length - 1 ? (
                        <button type="button" onClick={nextStep} className="flex items-center gap-2 sm:gap-3 px-8 sm:px-12 py-3.5 sm:py-5 bg-orange-gradient text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-orange-500/30 text-[10px] sm:text-xs">
                            Next <ArrowRight size={16} className="sm:size-[22px]" />
                        </button>
                    ) : (
                        <button type="submit" disabled={loading} className="flex items-center gap-2 sm:gap-3 px-10 sm:px-16 py-3.5 sm:py-5 bg-slate-900 text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl hover:bg-orange-600 disabled:opacity-50 text-[10px] sm:text-xs">
                            {loading ? <Loader2 className="animate-spin sm:size-[22px]" size={16} /> : 'Submit Deal'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
