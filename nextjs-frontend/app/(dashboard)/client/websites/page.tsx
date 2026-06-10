'use client';

import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { ExternalLink, Loader2, ShoppingBag } from 'lucide-react';
import api from '@/lib/api';

const webbuilderUrl = '/WEBbuilder/html_output/oursites.html';

type WebbuilderOrder = {
    fullName?: string;
    phone?: string;
    language?: string;
    websiteName?: string;
    cardTitle?: string;
    cardsample?: string;
    plan?: 'monthly' | 'yearly';
    adminOption?: 'Startup' | 'Pro';
    websiteLogoName?: string;
};

function getOrderPrice(order: WebbuilderOrder) {
    const yearly = order.plan === 'yearly';
    // Handle both 'With Admin'/'Without Admin' and 'Startup'/'Pro'
    const adminOpt = (order.adminOption || '').toLowerCase();
    const isStartup = adminOpt === 'startup' || adminOpt === 'with admin' || adminOpt === '';

    if (yearly) {
        return {
            amount: isStartup ? 130000 : 150000,
            renewal: isStartup ? 3500 : 2500,
            cycle: 'yearly',
        };
    }

    return {
        amount: isStartup ? 13000 : 15000,
        renewal: isStartup ? 350 : 250,
        cycle: 'monthly',
    };
}

export default function ClientWebsitesPage() {
    const [submitting, setSubmitting] = useState(false);
    const [lastMessage, setLastMessage] = useState('');

    const createOrder = useCallback(async (order: WebbuilderOrder) => {
        if (submitting) return;

        setSubmitting(true);
        setLastMessage('');

        try {
            const pricing = getOrderPrice(order);
            const plan = order.plan || 'monthly';
            // Map 'With Admin' → 'startup', 'Without Admin' → 'pro'
            const adminOpt = (order.adminOption || '').toLowerCase();
            const tier = (adminOpt === 'startup' || adminOpt === 'with admin') ? 'startup' : 'pro';
            const packageId = `${plan}-${tier}`;
            const description = [
                `Website name: ${order.websiteName || 'N/A'}`,
                `Template: ${order.cardTitle || 'N/A'} ${order.cardsample || ''}`.trim(),
                `Customer name: ${order.fullName || 'N/A'}`,
                `Phone: ${order.phone || 'N/A'}`,
                `Language: ${order.language || 'N/A'}`,
                `Renewal amount: LKR ${pricing.renewal} ${pricing.cycle}`,
                order.websiteLogoName ? `Logo file: ${order.websiteLogoName}` : '',
            ].filter(Boolean).join('\n');

            await api.post('/website-orders', {
                package_id: packageId,
                business_name: order.websiteName || order.cardTitle || 'WEBbuilder Site',
                preferred_domain: order.websiteName,
                notes: description,
            });

            setLastMessage('Order sent to admin. You can see the invoice in Billing.');
            alert('Website order sent to admin. Invoice added to your billing.');
            window.location.href = '/client/invoices';
        } catch (error) {
            console.error('Failed to create WEBbuilder order', error);
            const axiosError = error as AxiosError<{ error?: string; message?: string }>;
            setLastMessage(axiosError.response?.data?.error || axiosError.response?.data?.message || 'Order failed. Please contact support.');
            alert(axiosError.response?.data?.error || axiosError.response?.data?.message || 'Order failed. Please contact support.');
        } finally {
            setSubmitting(false);
        }
    }, [submitting]);

    useEffect(() => {
        const receiveOrder = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.type !== 'WEBBUILDER_ORDER') return;
            createOrder(event.data.payload || {});
        };

        window.addEventListener('message', receiveOrder);
        return () => window.removeEventListener('message', receiveOrder);
    }, [createOrder]);

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight uppercase">Order Website</h1>
                    <p className="text-slate-500 mt-2 font-medium text-base sm:text-lg italic">Choose a WEBbuilder design and submit the built-in order form.</p>
                </div>
                <a
                    href={webbuilderUrl}
                    target="_blank"
                    className="flex items-center justify-center gap-3 bg-slate-900 text-white px-6 sm:px-8 py-4 sm:py-5 rounded-[18px] sm:rounded-[24px] font-black uppercase tracking-widest text-[9px] sm:text-[10px] hover:bg-orange-600 transition-all shadow-xl shadow-slate-900/20 self-start lg:self-auto"
                >
                    <ExternalLink size={16} className="sm:size-[18px]" />
                    Open New Tab
                </a>
            </div>

            {submitting && (
                <div className="bg-orange-50 border border-orange-100 text-orange-700 rounded-[16px] sm:rounded-[24px] px-5 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm font-black flex items-center gap-3">
                    <Loader2 className="animate-spin" size={18} />
                    Sending order to admin...
                </div>
            )}

            {lastMessage && !submitting && (
                <div className="bg-white border border-slate-100 text-slate-600 rounded-[16px] sm:rounded-[24px] px-5 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm font-bold flex items-center gap-3">
                    <ShoppingBag size={18} className="text-orange-600" />
                    {lastMessage}
                </div>
            )}

            <div className="bg-white border border-slate-100 rounded-[20px] sm:rounded-[36px] overflow-hidden shadow-sm">
                <iframe
                    title="WEBbuilder Website Orders"
                    src={webbuilderUrl}
                    className="w-full h-[calc(100vh-240px)] min-h-[600px] sm:min-h-[720px] border-0 bg-white"
                />
            </div>
        </div>
    );
}
