'use client';

declare const payhere: any;

import { useState, useEffect } from 'react';
import { 
    CreditCard, 
    Download, 
    CheckCircle2, 
    Clock, 
    AlertCircle,
    Loader2,
    Shield,
    DollarSign,
    ArrowUpRight,
    Search,
    RefreshCw
} from 'lucide-react';
import api from '@/lib/api';

export default function ClientInvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthMissing, setIsAuthMissing] = useState(false);
    const [payingId, setPayingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInvoices();
        // Check for payment result in URL
        const params = new URLSearchParams(window.location.search);
        if (params.get('payment') === 'success') {
            alert('Payment successful! Your invoice has been updated.');
            window.history.replaceState({}, '', '/client/invoices');
        } else if (params.get('payment') === 'cancelled') {
            alert('Payment was cancelled. Your invoice is still pending.');
            window.history.replaceState({}, '', '/client/invoices');
        }
    }, []);

    const fetchInvoices = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('client_token') : null;
        if (!token) {
            setIsAuthMissing(true);
            setLoading(false);
            return;
        }

        try {
            setIsAuthMissing(false);
            // Use /invoices endpoint â€” scoped to client by the backend
            const response = await api.get('/invoices');
            setInvoices(response.data || []);
        } catch (error: any) {
            console.error('Failed to fetch invoices', error);
            if (error.response?.status === 401) {
                setIsAuthMissing(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async (invoiceId: number) => {
        setPayingId(invoiceId);
        try {
            const response = await api.post(`/payhere/init/${invoiceId}`);
            const paymentData = response.data;

            payhere.onCompleted = function(orderId: string) {
                console.log('Payment completed. OrderID: ' + orderId);
                setPayingId(null);
                fetchInvoices();
                alert(`âœ… Payment successful! Your service will be activated shortly.`);
            };

            payhere.onDismissed = function() {
                console.log('Payment dismissed');
                setPayingId(null);
            };

            payhere.onError = function(error: string) {
                console.log('Payment error: ' + error);
                setPayingId(null);
                alert(`âŒ Payment failed: ${error}. Please try again.`);
            };

            payhere.startPayment(paymentData);
        } catch (error: any) {
            console.error('Payment initialization failed', error);
            const msg = error.response?.data?.error || 'Failed to connect to payment gateway.';
            alert(`Payment Error: ${msg}`);
            setPayingId(null);
        }
    };

    const filteredInvoices = invoices.filter(inv =>
        (inv.invoice_number || inv.id || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.service_breakdown || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const statusColor = (status: string) => {
        const s = (status || '').toLowerCase();
        if (s === 'paid') return 'bg-green-50 text-green-600 border border-green-100';
        if (s === 'pending') return 'bg-orange-50 text-orange-600 border border-orange-100';
        if (s === 'cancelled' || s === 'failed') return 'bg-red-50 text-red-600 border border-red-100';
        return 'bg-slate-50 text-slate-400';
    };

    const totalDue = invoices
        .filter(i => (i.status || '').toLowerCase() === 'pending')
        .reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);

    const totalPaid = invoices
        .filter(i => (i.status || '').toLowerCase() === 'paid')
        .reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);

    const totalsByCurrency = (items: any[]) => {
        return items.reduce((acc: Record<string, number>, item: any) => {
            const currency = String(item.currency || 'USD').toUpperCase();
            acc[currency] = (acc[currency] || 0) + (parseFloat(item.amount || 0) || 0);
            return acc;
        }, {});
    };

    const dueByCurrency = totalsByCurrency(invoices.filter(i => (i.status || '').toLowerCase() === 'pending'));
    const paidByCurrency = totalsByCurrency(invoices.filter(i => (i.status || '').toLowerCase() === 'paid'));

    const formatCurrencyTotals = (totals: Record<string, number>) =>
        Object.entries(totals).map(([currency, amount]) => `${currency} ${amount.toFixed(2)}`).join(' / ');

    const formatBreakdown = (breakdown: string) => {
        if (!breakdown) return 'Service Payment';
        
        try {
            // Check if it's a JSON string
            if (breakdown.trim().startsWith('[') || breakdown.trim().startsWith('{')) {
                const data = JSON.parse(breakdown);
                if (Array.isArray(data)) {
                    return data.map((item: any) => {
                        const name = item.name || item.order?.websiteName || item.order?.cardTitle || item.package || 'Service';
                        const type = item.type || '';
                        return `${type ? type + ': ' : ''}${name}`;
                    }).join(', ');
                }
                if (typeof data === 'object') {
                    return data.name || data.order?.websiteName || data.order?.cardTitle || data.package || breakdown;
                }
            }
        } catch (e) {
            // Not JSON, return as is
        }
        
        return breakdown;
    };

    if (loading) {
        return (
            <div className="h-[600px] flex flex-col items-center justify-center text-slate-400 gap-4">
                <Loader2 className="animate-spin text-orange-500" size={60} />
                <p className="font-black tracking-widest uppercase text-[10px]">Loading Financial History...</p>
            </div>
        );
    }

    if (isAuthMissing) {
        return (
            <div className="h-[600px] flex flex-col items-center justify-center gap-6">
                <Shield size={60} className="text-slate-200" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Session expired. Please log in again.</p>
                <a href="/login/client" className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">Login</a>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase">Billing & Invoices</h1>
                    <p className="text-slate-500 mt-2 font-medium text-lg italic">Manage your payments and download historical invoices.</p>
                </div>
                <button 
                    onClick={fetchInvoices}
                    className="flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-[24px] font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Total Invoices</p>
                    <p className="text-4xl font-black text-slate-900">{invoices.length}</p>
                </div>
                <div className="bg-white border border-orange-100 rounded-[32px] p-8 shadow-sm">
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">Outstanding Due</p>
                    <p className="text-4xl font-black text-orange-600">{Object.keys(dueByCurrency).length > 1 ? 'Mixed' : totalDue.toFixed(2)}</p>
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mt-3 leading-relaxed">
                        {formatCurrencyTotals(dueByCurrency) || 'No pending invoices'}
                    </p>
                </div>
                <div className="bg-white border border-green-100 rounded-[32px] p-8 shadow-sm">
                    <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-3">Total Paid</p>
                    <p className="text-4xl font-black text-green-600">{Object.keys(paidByCurrency).length > 1 ? 'Mixed' : totalPaid.toFixed(2)}</p>
                    <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mt-3 leading-relaxed">
                        {formatCurrencyTotals(paidByCurrency) || 'No paid invoices'}
                    </p>
                </div>
            </div>

            {/* Invoice Table */}
            <div className="bg-white border border-slate-100 rounded-[48px] overflow-hidden shadow-sm">
                <div className="p-10 border-b border-slate-50 flex flex-wrap items-center justify-between gap-6">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Transaction History</h2>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search invoices..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-slate-50 border border-slate-100 rounded-[18px] py-3.5 pl-12 pr-6 text-sm text-slate-900 font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all shadow-sm w-72" 
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Invoice #</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Description</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Due Date</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredInvoices.length > 0 ? filteredInvoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50/50 transition-all group">
                                    <td className="p-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white border border-slate-100 rounded-[18px] flex items-center justify-center text-slate-300 group-hover:text-orange-600 group-hover:border-orange-100 transition-all shadow-sm">
                                                <CreditCard size={20} />
                                            </div>
                                            <div>
                                                <span className="font-black text-slate-900 tracking-tight block">{inv.invoice_number || `#${inv.id}`}</span>
                                                <span className="text-[10px] text-slate-400 font-bold">ID: {inv.id}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-8">
                                        <div className="flex flex-col gap-1 min-w-[250px] max-w-[400px]">
                                            <span className="text-sm text-slate-600 font-bold leading-tight">
                                                {formatBreakdown(inv.service_breakdown)}
                                            </span>
                                            {inv.invoice_number && (
                                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic truncate">
                                                    Ref: {inv.invoice_number}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-8 whitespace-nowrap">
                                        <span className="text-xl font-black text-slate-900 tracking-tighter">
                                            {inv.currency || 'USD'} {parseFloat(inv.amount || 0).toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="p-8 text-slate-500 font-bold text-sm">
                                        {inv.due_date 
                                            ? new Date(inv.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                                            : 'â€”'
                                        }
                                    </td>
                                    <td className="p-8">
                                        <span className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${statusColor(inv.status)}`}>
                                            {inv.status || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="p-8 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            {(inv.status || '').toLowerCase() === 'pending' && (
                                                <button 
                                                    onClick={() => handlePayment(inv.id)}
                                                    disabled={payingId === inv.id}
                                                    className="px-6 py-3 bg-orange-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-orange-600/20 flex items-center gap-2 disabled:opacity-60"
                                                >
                                                    {payingId === inv.id ? <Loader2 size={12} className="animate-spin" /> : <DollarSign size={12} />}
                                                    {payingId === inv.id ? 'Loading...' : 'Pay Now'}
                                                </button>
                                            )}
                                            {(inv.status || '').toLowerCase() === 'paid' && (
                                                <span className="flex items-center gap-1 text-green-600 text-[10px] font-black uppercase">
                                                    <CheckCircle2 size={14} /> Paid
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center text-slate-400 font-black uppercase tracking-widest text-[10px] italic">
                                        No billing records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PayHere Note */}
            <div className="bg-white border border-slate-100 p-10 rounded-[48px] flex flex-col md:flex-row items-center gap-8 shadow-sm">
                <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-[20px] flex items-center justify-center border border-orange-100 shrink-0">
                    <Shield size={32} />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h4 className="text-xl font-black text-slate-900 tracking-tight uppercase">Secured by PayHere</h4>
                    <p className="text-slate-500 mt-1 font-medium italic">All payments are processed securely through PayHere's PCI-DSS compliant gateway. Click "Pay Now" on any pending invoice to complete your payment.</p>
                </div>
            </div>
        </div>
    );
}

