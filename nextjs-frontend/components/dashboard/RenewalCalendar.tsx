'use client';

import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '@/lib/api';

export default function RenewalCalendar() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            // Check admin, agent, and client token keys
            const token = typeof window !== 'undefined'
                ? (localStorage.getItem('admin_token') || localStorage.getItem('agent_token') || localStorage.getItem('client_token') || localStorage.getItem('token'))
                : null;

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await api.get('/calendar');
                setEvents(response.data);
            } catch (error) {
                console.error('Calendar fetch failed:', error);
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const [selectedEvent, setSelectedEvent] = useState<any>(null);

    return (
        <div className="animate-in fade-in duration-700">
            {/* Detail Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Event Details</h3>
                            <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-orange-500 font-bold transition-colors uppercase text-[10px] tracking-widest">Close</button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Subject</p>
                                <p className="text-lg font-black text-slate-900">{selectedEvent.title}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Scheduled Date</p>
                                    <p className="text-sm font-black text-slate-900">{new Date(selectedEvent.start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                </div>
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Category</p>
                                    <p className="text-sm font-black text-orange-500 uppercase tracking-tight">{selectedEvent.extendedProps?.type || 'Milestone'}</p>
                                </div>
                            </div>

                            {selectedEvent.extendedProps?.client && (
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Client Entity</p>
                                    <p className="text-sm font-black text-slate-900">{selectedEvent.extendedProps.client}</p>
                                </div>
                            )}

                            {selectedEvent.extendedProps?.amount && (
                                <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100">
                                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Financial Value</p>
                                    <p className="text-lg font-black text-orange-600">{selectedEvent.extendedProps.amount}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-10">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Deployment Schedule</h2>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Strategic timeline for active assets.</p>
                </div>
                <div className="flex gap-6">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="w-3 h-3 rounded-full bg-orange-500 shadow-lg shadow-orange-500/20"></span>
                        Milestones
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="w-3 h-3 rounded-full bg-blue-900"></span>
                        Billing
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        Renewals
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="h-[600px] flex flex-col items-center justify-center text-slate-400 gap-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500 shadow-xl shadow-orange-500/10"></div>
                    <p className="font-black uppercase tracking-widest text-[10px]">Synchronizing Calendar...</p>
                </div>
            ) : (
                <div className="premium-calendar">
                    <FullCalendar
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        events={events}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,dayGridWeek'
                        }}
                        eventClick={(info) => setSelectedEvent(info.event)}
                        eventClassNames="rounded-xl px-3 py-2 border-none font-black text-[10px] uppercase tracking-widest cursor-pointer shadow-md shadow-black/5"
                        height={750}
                    />
                </div>
            )}

            <style jsx global>{`
                .premium-calendar .fc {
                    --fc-border-color: #f1f5f9;
                    --fc-today-bg-color: #fff7ed;
                    --fc-event-bg-color: #ff6b00;
                    --fc-event-border-color: #ff6b00;
                    font-family: 'Outfit', sans-serif;
                }
                .premium-calendar .fc-toolbar-title {
                    font-size: 1.5rem !important;
                    font-weight: 900 !important;
                    color: #0f172a;
                    text-transform: uppercase;
                    letter-spacing: -0.02em;
                }
                .premium-calendar .fc-button-primary {
                    background-color: #ffffff !important;
                    border: 1px solid #f1f5f9 !important;
                    color: #94a3b8 !important;
                    font-weight: 800 !important;
                    text-transform: uppercase !important;
                    font-size: 10px !important;
                    letter-spacing: 0.1em !important;
                    padding: 0.8rem 1.5rem !important;
                    border-radius: 16px !important;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
                    transition: all 0.3s ease !important;
                }
                .premium-calendar .fc-button-primary:hover {
                    background-color: #f8fafc !important;
                    color: #0f172a !important;
                    border-color: #e2e8f0 !important;
                }
                .premium-calendar .fc-button-active {
                    background-color: #0f172a !important;
                    border-color: #0f172a !important;
                    color: white !important;
                }
                .premium-calendar .fc-daygrid-day-number {
                    font-weight: 800;
                    color: #94a3b8;
                    padding: 15px !important;
                    font-size: 0.8rem;
                }
                .premium-calendar .fc-col-header-cell-cushion {
                    color: #0f172a;
                    font-weight: 900;
                    text-transform: uppercase;
                    font-size: 0.7rem;
                    letter-spacing: 0.1em;
                    padding: 20px 0 !important;
                }
                .premium-calendar .fc-day-today {
                    background-color: rgba(255, 107, 0, 0.03) !important;
                }
                .premium-calendar .fc-daygrid-event {
                    margin-top: 4px !important;
                    margin-bottom: 4px !important;
                }
            `}</style>
        </div>
    );
}
