'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
    DollarSign, 
    CreditCard, 
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2,
    Shield,
    Users,
    RefreshCw,
    Download,
    Search,
    Filter,
    X,
    Percent,
    Edit3,
    Save
} from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import api from '@/lib/api';

export default function AdminPaymentsPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthMissing, setIsAuthMissing] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [editingInvoice, setEditingInvoice] = useState<any | null>(null);
    const [editForm, setEditForm] = useState({ vat: '0', tax: '0', amount: '0', status: 'pending' });
    const [savingEdit, setSavingEdit] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'LKR'>('USD');
    const [liveRate, setLiveRate] = useState<number>(335);
    const [rateLoading, setRateLoading] = useState(true);

    // Use liveRate as the active exchange rate
    const exchangeRate = liveRate;

    useEffect(() => {
        fetchPayments();
        fetchLiveRate();
    }, []);

    const fetchLiveRate = async () => {
        try {
            const res = await api.get('/exchange-rate');
            if (res.data?.rate && res.data.rate > 1) {
                setLiveRate(Number(res.data.rate));
            }
        } catch {
            // keep fallback 335
        } finally {
            setRateLoading(false);
        }
    };

    const resolveCurrency = (txn: any) => {
        return String(txn?.currency || txn?.invoice?.currency || txn?.payment_currency || 'USD').toUpperCase();
    };

    const getExchangeRate = (txn: any) => {
        const val = txn?.exchange_rate || txn?.invoice?.exchange_rate;
        const direct = typeof val === 'number' ? val : parseFloat(String(val || ''));
        return (isNaN(direct) || direct <= 1) ? exchangeRate : direct;
    };

    const convertAmount = (amount: number, fromCurrency: string, toCurrency: string, rate?: number) => {
        const from = String(fromCurrency || 'USD').toUpperCase();
        const to = String(toCurrency || 'USD').toUpperCase();
        const activeRate = typeof rate === 'number' && rate > 1 ? rate : exchangeRate;

        if (from === to) return amount;
        if (from === 'USD' && to === 'LKR') return amount * activeRate;
        if (from === 'LKR' && to === 'USD') return amount / activeRate;
        return amount;
    };

    const formatSelectedCurrency = (amount: number) => {
        return `${selectedCurrency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    };

    const fetchPayments = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        if (!token) {
            setIsAuthMissing(true);
            setLoading(false);
            return;
        }

        try {
            setIsAuthMissing(false);
            const response = await api.get('/payments');
            const rows = Array.isArray(response.data) ? response.data : [];
            setTransactions(rows);

        } catch (error: any) {
            console.error('Failed to fetch payments', error);
            if (error.response?.status === 401) {
                setIsAuthMissing(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: number, status: string) => {
        setUpdatingId(id);
        try {
            await api.put(`/invoices/${id}`, { status });
            await fetchPayments();
        } catch (e) {
            console.error('Failed to update status', e);
        } finally {
            setUpdatingId(null);
        }
    };

    const openEditModal = (txn: any) => {
        setEditingInvoice(txn);
        // Calculate base amount (amount minus existing vat and tax)
        const totalAmount = parseFloat(txn.amount) || 0;
        const existingVat = parseFloat(txn.vat) || 0;
        const existingTax = parseFloat(txn.tax) || 0;
        const baseAmount = totalAmount - existingVat - existingTax;
        
        setEditForm({
            vat: String(existingVat),
            tax: String(existingTax),
            amount: String(baseAmount > 0 ? baseAmount : totalAmount),
            status: txn.status || 'pending'
        });
    };

    const formatBreakdown = (breakdown: string) => {
        if (!breakdown) return 'Service Payment';

        try {
            if (breakdown.trim().startsWith('[') || breakdown.trim().startsWith('{')) {
                const data = JSON.parse(breakdown) as Record<string, unknown> | Array<Record<string, unknown>>;
                const item = Array.isArray(data) ? data[0] : data;
                if (item?.type === 'Website Purchase') {
                    const domain = item.preferred_domain ? ` - ${String(item.preferred_domain)}` : '';
                    return `${item.type}: ${item.name}${domain}`;
                }
                if (Array.isArray(data)) {
                    return data.map((entry) => String(entry.name || entry.package || 'Service')).join(', ');
                }
                return String(item.name || item.package || 'Service Payment');
            }
        } catch {
            return breakdown;
        }

        return breakdown;
    };

    const handleEditSave = async () => {
        if (!editingInvoice) return;
        setSavingEdit(true);
        try {
            const baseAmount = parseFloat(editForm.amount) || 0;
            const vatAmount = parseFloat(editForm.vat) || 0;
            const taxAmount = parseFloat(editForm.tax) || 0;
            const finalAmount = baseAmount + vatAmount + taxAmount;

            await api.put(`/invoices/${editingInvoice.id}`, {
                vat: vatAmount,
                tax: taxAmount,
                amount: finalAmount,
                status: editForm.status,
            });
            setEditingInvoice(null);
            await fetchPayments();
        } catch (e) {
            console.error('Failed to update invoice', e);
        } finally {
            setSavingEdit(false);
        }
    };

    const baseAmount = parseFloat(editForm.amount) || 0;
    const vatAmount = parseFloat(editForm.vat) || 0;
    const taxAmount = parseFloat(editForm.tax) || 0;
    const computedTotal = baseAmount + vatAmount + taxAmount;
    const resolveEditingCurrency = (invoice: any) => String(invoice?.currency || 'USD').toUpperCase();

    const paymentStats = useMemo(() => {
        let revenue = 0;
        let processing = 0;
        let failedCount = 0;

        transactions.forEach((txn: any) => {
            const currency = resolveCurrency(txn);
            const rate = getExchangeRate(txn);
            const amount = Number(txn?.amount || 0);
            const converted = convertAmount(amount, currency, selectedCurrency, rate);
            const status = String(txn?.status || '').toLowerCase();

            if (status === 'paid') {
                revenue += converted;
            }

            if (status === 'pending') {
                processing += converted;
            }

            if (status === 'failed') {
                failedCount += 1;
            }
        });

        return {
            revenue: formatSelectedCurrency(revenue),
            processing: formatSelectedCurrency(processing),
            issues: `${failedCount} issues`,
        };
    }, [transactions, selectedCurrency]);

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase">Financial Ledger</h1>
                    <p className="text-slate-500 mt-2 font-medium text-lg italic">Monitor all incoming payments and transaction history.</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="bg-white border border-slate-100 rounded-[24px] p-2 shadow-sm flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectedCurrency('USD')}
                            className={`px-5 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                                selectedCurrency === 'USD' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-400 hover:text-slate-900'
                            }`}
                        >
                            USD
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedCurrency('LKR')}
                            className={`px-5 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                                selectedCurrency === 'LKR' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-400 hover:text-slate-900'
                            }`}
                        >
                            LKR
                        </button>
                    </div>
                    <button className="flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-5 rounded-[24px] font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20">
                        <Download size={18} />
                        Export Ledger
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StatCard 
                    title="Net Revenue" 
                    value={paymentStats.revenue} 
                    icon={DollarSign}
                    trend={{ value: "+0%", positive: true }}
                />
                <StatCard 
                    title="Processing" 
                    value={paymentStats.processing} 
                    icon={Clock}
                />
                <StatCard 
                    title="Transaction Issues" 
                    value={paymentStats.issues} 
                    icon={AlertCircle}
                    trend={{ value: "Live", positive: false }}
                />
            </div>

            {/* Transaction Table */}
            <div className="bg-white border border-slate-100 rounded-[48px] overflow-hidden shadow-sm min-h-[400px] flex flex-col">
                <div className="p-10 border-b border-slate-50 flex flex-wrap items-center justify-between gap-6">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Recent Transactions</h2>
                    <div className="flex gap-4 flex-1 max-w-md">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search transactions..." 
                                className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-3.5 pl-14 pr-6 text-sm text-slate-900 font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all" 
                            />
                        </div>
                        <button className="w-12 h-12 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-[18px] text-slate-400 hover:text-orange-600 transition-all">
                            <Filter size={20} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
                        <Loader2 className="animate-spin text-orange-500" size={60} />
                        <p className="font-black tracking-widest uppercase text-[10px]">Syncing Transactions...</p>
                    </div>
                ) : isAuthMissing ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 p-20">
                         <div className="w-24 h-24 bg-orange-50 rounded-[32px] flex items-center justify-center text-orange-500 border border-orange-100 shadow-xl shadow-orange-500/10">
                            <Shield size={48} />
                        </div>
                        <div className="space-y-2">
                            <p className="text-slate-900 font-black text-2xl uppercase tracking-tighter">Auth Required</p>
                            <p className="text-slate-500 text-sm max-w-xs mx-auto font-medium">Please authenticate to view the financial ledger.</p>
                            <button 
                                onClick={fetchPayments}
                                className="mt-8 px-10 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/20"
                            >
                                Secure Access
                            </button>
                        </div>
                    </div>
                ) : transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Invoice #</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Client</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Description</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Due Date</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {transactions.map((txn) => (
                                    <tr key={txn.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="p-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-orange-500 shadow-sm font-black text-xs">
                                                    TX
                                                </div>
                                                <span className="text-slate-700 font-mono text-sm font-black">{txn.transaction_id || `#${txn.id}`}</span>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex items-center gap-3 text-slate-900 font-black">
                                                <Users size={16} className="text-orange-500" />
                                                {txn.client_name || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <p className="max-w-xs text-sm text-slate-600 font-bold leading-tight">
                                                {formatBreakdown(txn.service_breakdown)}
                                            </p>
                                        </td>
                                        <td className="p-8">
                                            <p className="text-lg font-black text-slate-900 tracking-tight">
                                                {selectedCurrency} {convertAmount(parseFloat(txn.amount) || 0, resolveCurrency(txn), selectedCurrency, getExchangeRate(txn)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                            </p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                VAT: {selectedCurrency} {convertAmount(parseFloat(txn.vat || 0), resolveCurrency(txn), selectedCurrency, getExchangeRate(txn)).toLocaleString(undefined, { maximumFractionDigits: 2 })} &bull; Tax: {selectedCurrency} {convertAmount(parseFloat(txn.tax || 0), resolveCurrency(txn), selectedCurrency, getExchangeRate(txn)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                            </p>
                                        </td>
                                        <td className="p-8">
                                            <p className="text-sm font-black text-slate-900">{txn.due_date || 'N/A'}</p>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${
                                                    txn.status === 'Paid' || txn.status === 'paid' ? 'bg-green-50 text-green-600' : 
                                                    txn.status === 'Partial' || txn.status === 'partial' ? 'bg-blue-50 text-blue-600' :
                                                    'bg-red-50 text-red-600'
                                                }`}>
                                                    {txn.status}
                                                </span>
                                                {updatingId === txn.id ? (
                                                    <Loader2 size={16} className="animate-spin text-slate-400" />
                                                ) : (
                                                    <select
                                                        defaultValue=""
                                                        onChange={(e) => { if (e.target.value) updateStatus(txn.id, e.target.value); }}
                                                        className="text-[10px] font-black uppercase bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-slate-500 outline-none cursor-pointer hover:border-orange-300 transition-all"
                                                    >
                                                        <option value="" disabled>Change</option>
                                                        <option value="paid">Mark Paid</option>
                                                        <option value="partial">Mark Partial</option>
                                                        <option value="pending">Mark Pending</option>
                                                    </select>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <button
                                                onClick={() => openEditModal(txn)}
                                                className="flex items-center gap-2 px-5 py-3 bg-orange-50 text-orange-600 border border-orange-100 rounded-[16px] text-[10px] font-black uppercase tracking-widest hover:bg-orange-100 transition-all"
                                            >
                                                <Edit3 size={14} />
                                                Edit Price
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center gap-6">
                        <CreditCard size={60} className="text-slate-100" />
                        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">No transactions detected in the ledger.</p>
                    </div>
                )}
            </div>

            {/* Tax/VAT Override Modal */}
            {editingInvoice && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button
                            onClick={() => setEditingInvoice(null)}
                            className="absolute top-6 right-6 w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-4 mb-8 border-b border-slate-50 pb-6">
                            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                                <Percent size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Override Tax & VAT</h3>
                                <p className="text-xs text-slate-500 italic font-medium">
                                    Invoice {editingInvoice.transaction_id || `#${editingInvoice.id}`} &bull; {editingInvoice.client_name || 'Unknown'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Negotiated Base Amount ({resolveEditingCurrency(editingInvoice)})</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editForm.amount}
                                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 px-6 text-slate-900 font-black focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">VAT Amount ({resolveEditingCurrency(editingInvoice)})</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editForm.vat}
                                        onChange={(e) => setEditForm({ ...editForm, vat: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 px-6 text-slate-900 font-black focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Tax Amount ({resolveEditingCurrency(editingInvoice)})</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editForm.tax}
                                        onChange={(e) => setEditForm({ ...editForm, tax: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 px-6 text-slate-900 font-black focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Payment Status</label>
                                <select
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4 px-6 text-slate-900 font-black focus:ring-4 focus:ring-orange-500/10 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="partial">Partial</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>

                            {/* Live Total Preview */}
                            <div className="bg-slate-50 border border-slate-100 rounded-[24px] p-6 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-bold">Base Amount</span>
                                    <span className="text-slate-900 font-black">{resolveEditingCurrency(editingInvoice)} {baseAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-bold">+ VAT</span>
                                    <span className="text-orange-600 font-black">{resolveEditingCurrency(editingInvoice)} {vatAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-bold">+ Tax</span>
                                    <span className="text-orange-600 font-black">{resolveEditingCurrency(editingInvoice)} {taxAmount.toLocaleString()}</span>
                                </div>
                                <div className="border-t border-slate-200 pt-3 flex justify-between">
                                    <span className="text-slate-900 font-black uppercase text-xs tracking-widest">Final Total</span>
                                    <span className="text-xl font-black text-slate-900">{resolveEditingCurrency(editingInvoice)} {computedTotal.toLocaleString()}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleEditSave}
                                disabled={savingEdit}
                                className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-slate-900 text-white rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50"
                            >
                                {savingEdit ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                Save Override
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
