'use client';

import React from 'react';
import RenewalCalendar from '@/components/dashboard/RenewalCalendar';

export default function CalendarPage() {
    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            <div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase">Master Schedule</h1>
                <p className="text-slate-500 mt-2 font-medium text-lg italic">Track project milestones, renewals, and strategic payments.</p>
            </div>
            
            <div className="bg-white border border-slate-100 rounded-[48px] p-10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 orange-gradient opacity-5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10">
                    <RenewalCalendar />
                </div>
            </div>
        </div>
    );
}