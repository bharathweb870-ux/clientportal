'use client';

import { useState } from 'react';
import { 
    User, 
    Percent, 
    Shield, 
    CheckCircle2, 
    ArrowRight, 
    ArrowLeft,
    RefreshCw,
    Key,
    Mail,
    Loader2,
    ChevronLeft,
    Briefcase,
    Target,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

const steps = [
    { id: 'agent', title: 'Identity', icon: User },
    { id: 'earnings', title: 'Commissions', icon: Percent },
    { id: 'access', title: 'Access', icon: Shield },
];

export default function AdminNewAgentPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        full_name: '', email: '', phone: '', whatsapp: '',
        commission_rate: '25', target_monthly: '',
        username: '', password: '', role: 'agent', send_email: true
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        setFormData({ 
            ...formData, 
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
        });
        if (error) setError(null);
    };

    const generateCredentials = () => {
        const namePart = formData.full_name.split(' ')[0].toLowerCase() || 'agent';
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const generatedUsername = `${namePart}_${randomNum}`;
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
        if (currentStep === 1 && !formData.username) {
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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && currentStep < steps.length - 1) {
            e.preventDefault();
            nextStep(e);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await api.post('/agents', formData);
            window.location.href = '/admin/agents';
        } catch (err: any) {
            console.error('Agent registration failed:', err);
            const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
            setError(`Error: ${errorMsg}. Please check your credentials and try again.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in slide-in-from-bottom duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <Link 
                        href="/admin/agents"
                        className="w-14 h-14 bg-white border border-slate-100 rounded-[20px] flex items-center justify-center text-slate-400 hover:text-orange-600 hover:border-orange-100 transition-all shadow-sm"
                    >
                        <ChevronLeft size={28} />
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Onboard Agent</h1>
                        <p className="text-slate-500 mt-1 font-medium italic">Add a new sales partner to WEBbuilders.lk</p>
                    </div>
                </div>
            </div>

            {/* Step Indicator */}
            <div className="flex justify-center items-center bg-white border border-slate-100 p-10 rounded-[48px] shadow-sm relative overflow-hidden">
                <div className="absolute top-1/2 left-40 right-40 h-[1px] bg-slate-100 -translate-y-1/2 z-0 hidden md:block"></div>
                {steps.map((step, index) => (
                    <div key={step.id} className="relative z-10 flex flex-col items-center gap-4 px-12">
                        <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-500 ${
                            index <= currentStep ? 'orange-gradient text-white scale-110 shadow-2xl shadow-orange-500/20' : 'bg-slate-50 border border-slate-100 text-slate-300'
                        }`}>
                            <step.icon size={28} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] hidden md:block ${index <= currentStep ? 'text-orange-600' : 'text-slate-400'}`}>
                            {step.title}
                        </span>
                    </div>
                ))}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 p-8 rounded-[32px] flex items-center gap-4 text-red-600 animate-in fade-in slide-in-from-top-4 duration-300 shadow-sm">
                    <AlertCircle size={24} />
                    <p className="font-black text-sm uppercase tracking-widest">{error}</p>
                </div>
            )}

            <form 
                onSubmit={handleSubmit} 
                onKeyDown={handleKeyDown}
                className="bg-white border border-slate-100 p-16 rounded-[64px] shadow-sm relative overflow-hidden"
            >
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-96 h-96 orange-gradient opacity-5 rounded-full -ml-48 -mt-48 blur-3xl pointer-events-none"></div>

                {currentStep === 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="md:col-span-2 flex items-center gap-5 text-orange-600 mb-6 border-b border-slate-50 pb-8">
                            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                                <User size={32} />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Agent Identity</h3>
                                <p className="text-sm font-medium text-slate-500 italic">Personal and contact details of the partner.</p>
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Full Legal Name</label>
                            <input name="full_name" value={formData.full_name} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-[24px] py-5 px-8 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all placeholder-slate-300 shadow-sm" placeholder="Legal full name" required />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Strategic Email</label>
                            <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-[24px] py-5 px-8 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all placeholder-slate-300 shadow-sm" placeholder="agent@webbuilders.lk" required />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">WhatsApp Protocol</label>
                            <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-[24px] py-5 px-8 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all placeholder-slate-300 shadow-sm" placeholder="+94 7X XXX XXXX" />
                        </div>
                    </div>
                )}

                {currentStep === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="md:col-span-2 flex items-center gap-5 text-orange-600 mb-6 border-b border-slate-50 pb-8">
                            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                                <Percent size={32} />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Earning Structures</h3>
                                <p className="text-sm font-medium text-slate-500 italic">Define commission rates and sales targets.</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Commission Rate (%)</label>
                            <div className="relative">
                                <input name="commission_rate" type="number" value={formData.commission_rate} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-[24px] py-5 px-8 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all shadow-sm" />
                                <Percent className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200" size={20} />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Monthly Velocity Target (LKR)</label>
                            <div className="relative">
                                <input name="target_monthly" type="number" value={formData.target_monthly} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-[24px] py-5 px-8 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all shadow-sm" placeholder="500,000" />
                                <Target className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200" size={20} />
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="flex items-center gap-5 text-orange-600 mb-6 border-b border-slate-50 pb-8">
                            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                                <Shield size={32} />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Agent Portal Access</h3>
                                <p className="text-sm font-medium text-slate-500 italic">Generate secure credentials for the agent dashboard.</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-slate-50 p-12 rounded-[48px] border border-slate-100 relative group shadow-inner">
                            <div className="space-y-3 relative">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Strategic Username</label>
                                <div className="relative">
                                    <input name="username" value={formData.username} onChange={handleChange} className="w-full bg-white border border-slate-100 rounded-[20px] py-5 px-8 text-slate-900 font-black focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-mono shadow-sm" placeholder="agent_username" />
                                    <User className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200" size={20} />
                                </div>
                            </div>
                            
                            <div className="space-y-3 relative">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Access Key</label>
                                <div className="relative">
                                    <input name="password" value={formData.password} onChange={handleChange} className="w-full bg-white border border-slate-100 rounded-[20px] py-5 px-8 text-slate-900 font-black focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-mono shadow-sm" placeholder="agent_password" />
                                    <Key className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200" size={20} />
                                </div>
                            </div>

                            <div className="md:col-span-2 flex justify-center">
                                <button 
                                    type="button"
                                    onClick={generateCredentials}
                                    className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
                                >
                                    <RefreshCw size={18} />
                                    Generate Secure Credentials
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 p-10 bg-orange-50 border border-orange-100 rounded-[32px] shadow-sm">
                            <div className="w-16 h-16 bg-white border border-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm">
                                <Mail size={32} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-slate-900 font-black text-sm uppercase tracking-wider">Send Partner Welcome Kit</h4>
                                <p className="text-slate-500 text-xs mt-1 font-medium italic">Credentials and kit will be dispatched to {formData.email || 'the partner email'}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" name="send_email" checked={formData.send_email} onChange={handleChange} className="sr-only peer" />
                                <div className="w-16 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-600 shadow-inner"></div>
                            </label>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-16 pt-10 border-t border-slate-50 flex justify-between items-center relative z-10">
                    <button
                        type="button"
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className={`flex items-center gap-3 px-10 py-5 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${
                            currentStep === 0 ? 'opacity-0 disabled:cursor-not-allowed' : 'text-slate-400 hover:text-orange-600 hover:bg-orange-50'
                        }`}
                    >
                        <ArrowLeft size={22} />
                        Strategic Back
                    </button>

                    {currentStep < steps.length - 1 ? (
                        <button
                            type="button"
                            onClick={nextStep}
                            className="flex items-center gap-3 px-12 py-5 orange-gradient text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-orange-500/30"
                        >
                            Next Step
                            <ArrowRight size={22} />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-3 px-16 py-5 orange-gradient text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-orange-500/30 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={22} />
                                    Establishing Account...
                                </>
                            ) : (
                                <>
                                    Complete Onboarding
                                    <CheckCircle2 size={22} className="group-hover:rotate-12 transition-transform" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
