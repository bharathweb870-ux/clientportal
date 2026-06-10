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
    Shield,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useSearchParams } from 'next/navigation';

export default function ClientsPage() {
    const searchParams = useSearchParams();
    const urlStatus = searchParams.get('status');
    
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAuthMissing, setIsAuthMissing] = useState(false);
    
    // Approval Modal State
    const [approvingClient, setApprovingClient] = useState<any>(null);
    const [approvePassword, setApprovePassword] = useState('');
    const [approveBaseValue, setApproveBaseValue] = useState(''); // LKR display value
    const [approveBaseUSD, setApproveBaseUSD] = useState(0);      // Raw USD service total
    const [approveExchangeRate, setApproveExchangeRate] = useState(335); // LKR per USD
    const [liveRate, setLiveRate] = useState(335);
    const [approveServices, setApproveServices] = useState<any>({});
    const [approveVatPercent, setApproveVatPercent] = useState('');
    const [approveTaxPercent, setApproveTaxPercent] = useState('');
    const [approveDeadline, setApproveDeadline] = useState('');
    const [isApproving, setIsApproving] = useState(false);
    const [isVerifying, setIsVerifying] = useState<number | null>(null);
    const [settings, setSettings] = useState<any>({ vat: 0, tax: 0 });

    useEffect(() => {
        fetchClients();
        fetchLiveRate();
    }, []);

    const fetchLiveRate = async () => {
        try {
            const res = await api.get('/exchange-rate');
            if (res.data?.rate && res.data.rate > 1) {
                setLiveRate(Number(res.data.rate));
                setApproveExchangeRate(Number(res.data.rate));
            }
        } catch {
            // Keep fallback
        }
    };

    useEffect(() => {
        if (approvingClient) {
            let pData = approvingClient.pending_data;
            if (typeof pData === 'string') {
                try { pData = JSON.parse(pData); } catch(e) {}
            }

            const exchangeRate = Number(pData?.exchange_rate || liveRate);
            setApproveExchangeRate(exchangeRate);

            if (pData?.services) {
                const s = { ...pData.services };
                setApproveServices(s);

                // Compute raw USD service total (no tax)
                let initialBaseUSD = 0;
                if (s.hosting?.selected) initialBaseUSD += Number(s.hosting.negotiated_price || s.hosting.original_price || 0);
                if (s.management?.selected) initialBaseUSD += Number(s.management.negotiated_price || s.management.original_price || 0);
                if (s.development?.selected) initialBaseUSD += Number(s.development.negotiated_price || s.development.original_price || 0);

                setApproveBaseUSD(initialBaseUSD);
                setApproveBaseValue((initialBaseUSD * exchangeRate).toString());
            } else {
                setApproveServices({});
                // Legacy: suggested_value is already in LKR with VAT applied by agent
                const suggestedLkr = parseFloat(approvingClient.suggested_value || 0);
                const baseUSD = suggestedLkr / exchangeRate;
                setApproveBaseUSD(baseUSD);
                setApproveBaseValue(suggestedLkr.toString());
            }

            // --- VAT/Tax rate priority ---
            // 1. Use rates locked in at deal submission time (stored in pending_data.vat / .tax)
            //    so held deals are never re-priced if the admin changes global settings later.
            // 2. Fall back to current global settings only when pending_data has no rates.
            const lockedVat = pData?.vat !== undefined && pData?.vat !== '' ? String(pData.vat) : null;
            const lockedTax = pData?.tax !== undefined && pData?.tax !== '' ? String(pData.tax) : null;

            if (lockedVat !== null && lockedTax !== null) {
                // Rates are locked from deal-time — use them directly, skip the API call
                setApproveVatPercent(lockedVat);
                setApproveTaxPercent(lockedTax);
                setSettings({ vat: Number(lockedVat), tax: Number(lockedTax) });
            } else {
                // No rates in pending_data (legacy submissions) — fall back to current settings
                api.get('/settings/defaults').then(res => {
                    const vatP = res.data.default_vat_percentage || 0;
                    const taxP = res.data.default_tax_percentage || 0;
                    setSettings({ vat: vatP, tax: taxP });
                    setApproveVatPercent(vatP.toString());
                    setApproveTaxPercent(taxP.toString());
                });
            }
        }
    }, [approvingClient]);


    const handleServicePriceChange = (type: string, value: string) => {
        setApproveServices((prev: any) => {
            const updated = { ...prev };
            if (updated[type]) {
                updated[type] = { ...updated[type], negotiated_price: Number(value) };
            }

            // Recompute USD base from updated service prices
            let newBaseUSD = 0;
            if (updated.hosting?.selected) newBaseUSD += Number(updated.hosting.negotiated_price || 0);
            if (updated.management?.selected) newBaseUSD += Number(updated.management.negotiated_price || 0);
            if (updated.development?.selected) newBaseUSD += Number(updated.development.negotiated_price || 0);

            setApproveBaseUSD(newBaseUSD);
            setApproveBaseValue((newBaseUSD * approveExchangeRate).toString());
            return updated;
        });
    };

    // --- Derived display values (mirrors backend logic exactly) ---
    // Backend: vatUsd = totalUsd * vatRate, grandTotal = (totalUsd + vatUsd + taxUsd) * exchangeRate
    const vatAmountUSD = (approveBaseUSD * parseFloat(approveVatPercent || '0')) / 100;
    const taxAmountUSD = (approveBaseUSD * parseFloat(approveTaxPercent || '0')) / 100;
    const grandTotalUSD = approveBaseUSD + vatAmountUSD + taxAmountUSD;
    const vatAmount = vatAmountUSD * approveExchangeRate;
    const taxAmount = taxAmountUSD * approveExchangeRate;
    const totalCharge = grandTotalUSD * approveExchangeRate;

    // Handle manual base value override (LKR → back-calculate USD)
    const handleBaseChange = (val: string) => {
        setApproveBaseValue(val);
        const lkrVal = parseFloat(val || '0');
        setApproveBaseUSD(approveExchangeRate > 0 ? lkrVal / approveExchangeRate : 0);
    };

    const fetchClients = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        if (!token) {
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

    const handleApprove = async () => {
        if (!approvePassword) return;

        // Strong password validation
        // Simplified password validation for Admin
        if (approvePassword.length < 6) {
            alert('Password must be at least 6 characters long.');
            return;
        }

        setIsApproving(true);
        try {
            await api.post(`/clients/${approvingClient.id}/approve`, { 
                password: approvePassword,
                base_amount: approveBaseValue,
                vat_amount: vatAmount,
                tax_amount: taxAmount,
                project_deadline: approveDeadline,
                services: approveServices
            });
            setApprovingClient(null);
            setApprovePassword('');
            setApproveBaseValue('');
            setApproveVatPercent('');
            setApproveTaxPercent('');
            fetchClients();
        } catch (error) {
            alert('Approval failed. Please try again.');
        } finally {
            setIsApproving(false);
        }
    };

    const handleForceVerify = async (clientId: number) => {
        setIsVerifying(clientId);
        try {
            await api.post(`/clients/${clientId}/force-verify`);
            fetchClients();
        } catch {
            alert('Verification failed.');
        } finally {
            setIsVerifying(null);
        }
    };

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

    const filteredClients = clients.filter(client => {
        const matchesSearch = 
            (client.full_name || client.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.company_name || client.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = urlStatus ? client.status === urlStatus : true;
        
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6 sm:space-y-10 animate-in fade-in duration-700 pb-20 px-1 sm:px-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight uppercase">
                        {urlStatus === 'pending' ? 'Approval Queue' : 'Client Network'}
                    </h1>
                    <p className="text-slate-500 mt-1 sm:mt-2 font-medium text-sm sm:text-lg italic">
                        {urlStatus === 'pending' ? 'Review and activate new registrations from your agents.' : 'View and manage all registered clients for WEBbuilders.lk'}
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 sm:gap-4">
                    {urlStatus && (
                        <Link href="/admin/clients" className="flex items-center justify-center px-5 sm:px-8 py-3 bg-slate-100 text-slate-600 rounded-[18px] sm:rounded-[24px] font-black uppercase tracking-widest text-[9px] sm:text-[10px]">
                            View All
                        </Link>
                    )}
                    <Link 
                        href="/admin/clients/new"
                        className="flex items-center justify-center gap-2 sm:gap-3 orange-gradient text-white px-6 sm:px-10 py-3 sm:py-5 rounded-[18px] sm:rounded-[24px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-orange-500/30 text-[9px] sm:text-xs"
                    >
                        <Plus size={16} className="sm:size-[20px]" />
                        <span className="hidden sm:inline">Register New Client</span>
                        <span className="sm:hidden">Register</span>
                    </Link>
                </div>
            </div>

            {/* Approval Modal */}
            {approvingClient && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[48px] p-8 md:p-12 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto overflow-x-hidden">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <Shield size={40} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase">Verify & Approve</h2>
                            <p className="text-slate-500 font-medium mt-2">Setting password for <b>{approvingClient.full_name}</b></p>
                        </div>

                        <div className="space-y-4">
                            {approvingClient.pending_data && (
                                <div className="bg-slate-50 p-4 rounded-[20px] border border-slate-100 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agent Suggested Charge</span>
                                    <span className="text-sm font-black text-slate-900">
                                        LKR {Number(approvingClient.suggested_value || 0).toLocaleString()}
                                    </span>
                                </div>
                            )}

                            {approveServices && Object.keys(approveServices).length > 0 && (
                                <div className="bg-white border border-slate-100 p-5 rounded-[20px] space-y-3 shadow-sm">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Negotiate Services (USD)</h4>
                                    
                                    {approveServices.hosting?.selected && (
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-xs font-bold text-slate-900">Hosting: {approveServices.hosting.package_name}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase">Base: ${approveServices.hosting.original_price}</p>
                                            </div>
                                            <input 
                                                type="number" 
                                                value={approveServices.hosting.negotiated_price} 
                                                onChange={(e) => handleServicePriceChange('hosting', e.target.value)}
                                                className="w-20 bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-right font-black text-orange-600 outline-none focus:ring-2 focus:ring-orange-500/20 text-xs"
                                            />
                                        </div>
                                    )}

                                    {approveServices.management?.selected && (
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-xs font-bold text-slate-900">Mgmt: {approveServices.management.package_name}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase">Base: ${approveServices.management.original_price}</p>
                                            </div>
                                            <input 
                                                type="number" 
                                                value={approveServices.management.negotiated_price} 
                                                onChange={(e) => handleServicePriceChange('management', e.target.value)}
                                                className="w-20 bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-right font-black text-orange-600 outline-none focus:ring-2 focus:ring-orange-500/20 text-xs"
                                            />
                                        </div>
                                    )}

                                    {approveServices.development?.selected && (
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-xs font-bold text-slate-900">Dev: {approveServices.development.project_name || 'Custom'}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase">Base: ${approveServices.development.original_price}</p>
                                            </div>
                                            <input 
                                                type="number" 
                                                value={approveServices.development.negotiated_price} 
                                                onChange={(e) => handleServicePriceChange('development', e.target.value)}
                                                className="w-20 bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-right font-black text-orange-600 outline-none focus:ring-2 focus:ring-orange-500/20 text-xs"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Base Project Value (LKR)</label>
                                    <input 
                                        type="number"
                                        value={approveBaseValue}
                                        onChange={(e) => handleBaseChange(e.target.value)}
                                        placeholder="Enter base charge..."
                                        className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 px-6 text-slate-900 font-black focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1.5">
                                            VAT Rate (%)
                                            {(() => {
                                                let pd = approvingClient?.pending_data;
                                                if (typeof pd === 'string') try { pd = JSON.parse(pd); } catch(e) {}
                                                return pd?.vat !== undefined && pd?.vat !== '' ? (
                                                    <span className="bg-amber-100 text-amber-600 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md" title="Rate locked from deal submission">Deal-Locked</span>
                                                ) : null;
                                            })()}
                                        </label>
                                        <input 
                                            type="number"
                                            value={approveVatPercent}
                                            onChange={(e) => setApproveVatPercent(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 px-6 text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1.5">
                                            Tax Rate (%)
                                            {(() => {
                                                let pd = approvingClient?.pending_data;
                                                if (typeof pd === 'string') try { pd = JSON.parse(pd); } catch(e) {}
                                                return pd?.tax !== undefined && pd?.tax !== '' ? (
                                                    <span className="bg-amber-100 text-amber-600 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md" title="Rate locked from deal submission">Deal-Locked</span>
                                                ) : null;
                                            })()}
                                        </label>
                                        <input 
                                            type="number"
                                            value={approveTaxPercent}
                                            onChange={(e) => setApproveTaxPercent(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 px-6 text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Target Project Deadline</label>
                                <input 
                                    type="date"
                                    value={approveDeadline}
                                    onChange={(e) => setApproveDeadline(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 px-6 text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all text-sm"
                                />
                            </div>

                            <div className="bg-orange-50 p-6 rounded-[24px] border border-orange-100 space-y-2">
                                <div className="flex justify-between text-[10px] font-bold text-orange-400 uppercase tracking-widest">
                                    <span>Calculated VAT/Tax</span>
                                    <span>LKR {(vatAmount + taxAmount).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">Final Total Charge</span>
                                    <span className="text-xl font-black text-orange-600">
                                        LKR {totalCharge.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Define Client Password</label>
                                <input 
                                    type="text"
                                    value={approvePassword}
                                    onChange={(e) => setApprovePassword(e.target.value)}
                                    placeholder="Enter secure password..."
                                    className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 px-6 text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button 
                                onClick={() => setApprovingClient(null)}
                                className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[24px] font-black uppercase tracking-widest text-xs"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleApprove}
                                disabled={!approvePassword || isApproving}
                                className="flex-1 py-5 orange-gradient text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl shadow-orange-500/20 disabled:opacity-50"
                            >
                                {isApproving ? 'Activating...' : 'Approve Now'}
                            </button>
                        </div>
                        {!approvingClient.is_verified && (
                            <p className="text-orange-500 text-[10px] font-black uppercase text-center flex items-center justify-center gap-2">
                                <Shield size={14} /> Admin Bypass: Verification not required
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Filters Bar */}
            <div className="bg-white border border-slate-100 p-4 sm:p-6 rounded-[20px] sm:rounded-[32px] flex flex-wrap items-center gap-4 sm:gap-6 shadow-sm">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search by name, company, or email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-[16px] sm:rounded-[20px] py-3 sm:py-4 pl-10 sm:pl-16 pr-4 sm:pr-8 text-xs sm:text-sm text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Clients Table */}
            <div className="bg-white border border-slate-100 rounded-[28px] sm:rounded-[48px] overflow-hidden shadow-sm min-h-[400px] flex flex-col">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
                        <Loader2 className="animate-spin text-orange-500" size={60} />
                        <p className="font-black tracking-widest uppercase text-[10px]">Loading Network...</p>
                    </div>
                ) : filteredClients.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="p-4 sm:p-8 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Client & Company</th>
                                    <th className="p-4 sm:p-8 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hidden sm:table-cell">Contact</th>
                                    <th className="p-4 sm:p-8 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                    <th className="p-4 sm:p-8 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hidden sm:table-cell">Payment</th>
                                    <th className="p-4 sm:p-8 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredClients.map((client) => (
                                    <tr key={client.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="p-4 sm:p-8">
                                            <div className="flex items-center gap-3 sm:gap-5">
                                                <div className="w-10 h-10 sm:w-16 sm:h-16 orange-gradient rounded-[14px] sm:rounded-[24px] flex items-center justify-center text-white font-black text-base sm:text-2xl shadow-xl shadow-orange-500/20 group-hover:scale-110 transition-transform shrink-0">
                                                    {(client.full_name || client.name || 'C')[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-slate-900 font-black text-sm sm:text-lg truncate">{client.full_name || client.name}</p>
                                                    <div className="flex flex-wrap items-center gap-1 text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mt-1">
                                                        <Building2 size={10} className="text-orange-500 shrink-0" />
                                                        <span className="truncate max-w-[120px] sm:max-w-none">{client.company_name || 'Individual'}</span>
                                                    </div>
                                                    {renderServices(client)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 sm:p-8 hidden sm:table-cell">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2.5 text-slate-600 text-sm font-bold">
                                                    <Mail size={14} className="text-slate-400" />
                                                    {client.email}
                                                    {client.is_verified ? (
                                                        <span className="bg-green-100 text-green-600 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md">Verified</span>
                                                    ) : (
                                                        <span className="bg-slate-100 text-slate-400 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md">Unverified</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2.5 text-slate-600 text-sm font-bold">
                                                    <Phone size={14} className="text-slate-400" />
                                                    {client.phone}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 sm:p-8">
                                            <span className={`px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] ${
                                                client.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                                            }`}>
                                                {client.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="p-4 sm:p-8 hidden sm:table-cell">
                                            <span className={`px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] ${
                                                client.payment_status === 'paid' ? 'bg-green-50 text-green-600' : 
                                                client.payment_status === 'partial' ? 'bg-blue-50 text-blue-600' : 
                                                'bg-red-50 text-red-600'
                                            }`}>
                                                {client.payment_status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="p-4 sm:p-8 text-right">
                                            <div className="flex justify-end gap-2 sm:gap-3 flex-wrap">
                                                {!client.is_verified && (
                                                    <button
                                                        onClick={() => handleForceVerify(client.id)}
                                                        disabled={isVerifying === client.id}
                                                        title="Admin: Force Verify Email"
                                                        className="px-3 sm:px-5 h-9 sm:h-12 flex items-center gap-1.5 sm:gap-2 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-[14px] sm:rounded-[18px] transition-all shadow-sm font-black uppercase tracking-widest text-[9px] sm:text-[10px] disabled:opacity-50"
                                                    >
                                                        {isVerifying === client.id ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 size={12} />
                                                        )}
                                                        <span className="hidden sm:inline">Verify</span>
                                                    </button>
                                                )}
                                                {client.status === 'pending' && (
                                                    <button 
                                                        onClick={() => setApprovingClient(client)}
                                                        className="px-3 sm:px-6 h-9 sm:h-12 flex items-center justify-center bg-green-500 text-white rounded-[14px] sm:rounded-[18px] transition-all shadow-lg shadow-green-500/20 font-black uppercase tracking-widest text-[9px] sm:text-[10px]"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                <Link 
                                                    href={`/admin/clients/view?id=${client.id}`}
                                                    className="w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center bg-slate-50 text-slate-400 rounded-[14px] sm:rounded-[18px] hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                                    title="Manage Client"
                                                >
                                                    <ArrowUpRight size={16} className="sm:size-[20px]" />
                                                </Link>
                                                <button 
                                                    onClick={() => {
                                                        if(confirm('Are you sure you want to delete this client?')) {
                                                            api.delete(`/clients/${client.id}`).then(() => fetchClients());
                                                        }
                                                    }}
                                                    className="w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-[14px] sm:rounded-[18px] hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                >
                                                    <AlertCircle size={16} className="sm:size-[20px]" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 sm:p-20 text-center gap-6">
                        <Users size={60} className="text-slate-100" />
                        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">No strategic clients detected.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
