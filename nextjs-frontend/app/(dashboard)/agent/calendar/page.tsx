'use client';

import React from 'react';
import RenewalCalendar from '@/components/dashboard/RenewalCalendar';

export default function CalendarPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Schedule & Deadlines</h1>
                <p className="text-slate-500">View all upcoming project milestones, domain renewals, and pending payments.</p>
            </div>
            
            <RenewalCalendar />
        </div>
    );
}
