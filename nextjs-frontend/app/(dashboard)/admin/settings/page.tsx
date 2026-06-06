'use client';

import { useState, useEffect } from 'react';
import { 
    Settings, 
    Percent, 
    Save, 
    Loader2, 
    CheckCircle2, 
    AlertCircle,
    ShieldCheck,
    Coins
} from 'lucide-react';
import api from '@/lib/api';

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [settings, setSettings] = useState({
        default_vat_percentage: 0,
        default_tax_percentage: 0,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            const data = res.data;
            const newSettings = { ...settings };
            data.forEach((s: any) => {
                if (s.key in newSettings) {
                    newSettings[s.key as keyof typeof settings] = parseFloat(s.value);
                }
            });
            setSettings(newSettings);
        } catch (err) {
            console.error('Failed to fetch settings', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            await api.post('/settings', { settings });
            setMessage({ type: 'success', text: 'Financial configurations updated successfully!' });
            setTimeout(() => setMessage(null), 5000);
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Failed to update settings.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Global Settings</h1>
                    <p className="text-slate-500 mt-1 font-medium italic">Configure system-wide financial and operational parameters</p>
                </div>
            </div>

            {message && (
                <div className={`p-6 rounded-[24px] flex items-center gap-4 animate-in slide-in-from-top-4 duration-300 shadow-sm border ${
                    message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
                }`}>
                    {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    <p className="font-bold text-sm uppercase tracking-wider">{message.text}</p>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-8">
                {/* Financial Controls */}
                <div className="bg-white border border-slate-100 p-10 rounded-[48px] shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 blur-3xl opacity-50 -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110"></div>
                    
                    <div className="flex items-center gap-4 mb-10 border-b border-slate-50 pb-8 relative z-10">
                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                            <Coins size={28} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Tax & VAT Configuration</h3>
                            <p className="text-xs font-medium text-slate-400 italic mt-1">Default percentages applied to all new invoices and renewals.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Default VAT (%)</label>
                                <Percent size={14} className="text-slate-300" />
                            </div>
                            <input 
                                type="number" 
                                step="0.01"
                                value={settings.default_vat_percentage}
                                onChange={(e) => setSettings({...settings, default_vat_percentage: parseFloat(e.target.value) || 0})}
                                className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-5 px-8 text-slate-900 font-black focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Strategic Tax (%)</label>
                                <Percent size={14} className="text-slate-300" />
                            </div>
                            <input 
                                type="number" 
                                step="0.01"
                                value={settings.default_tax_percentage}
                                onChange={(e) => setSettings({...settings, default_tax_percentage: parseFloat(e.target.value) || 0})}
                                className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-5 px-8 text-slate-900 font-black focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="mt-10 p-6 bg-slate-50 rounded-[24px] border border-slate-100 flex items-start gap-4">
                        <ShieldCheck size={20} className="text-slate-400 mt-1 shrink-0" />
                        <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                            Note: These percentages will be automatically added to all new registrations and service renewals. 
                            You can still override these values manually when approving payments or creating manual invoices.
                        </p>
                    </div>
                </div>

                {/* Submit Action */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-3 px-12 py-5 bg-slate-900 text-white rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-slate-900/20 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Save Global Configuration
                    </button>
                </div>
            </form>
        </div>
    );
}
