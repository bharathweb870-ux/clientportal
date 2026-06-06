'use client';

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
    trend?: {
        value: string;
        positive: boolean;
    };
}

export default function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
    return (
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm group hover:border-orange-500/30 hover:shadow-md transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="flex justify-between items-start relative z-10">
                <div className="w-14 h-14 bg-slate-50 text-orange-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-orange-600 group-hover:text-white transition-all duration-500">
                    <Icon size={28} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        trend.positive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                        {trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {trend.value}
                    </div>
                )}
            </div>

            <div className="mt-8 relative z-10">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{title}</h3>
                <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-black text-slate-900 tracking-tight">{value}</p>
                </div>
                {description && (
                    <p className="text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-widest leading-relaxed">{description}</p>
                )}
            </div>
        </div>
    );
}