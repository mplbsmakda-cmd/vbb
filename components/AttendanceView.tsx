import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { Attendance, AttendanceStatus } from '../types';
import Card from './Card';
import Spinner from './Spinner';

interface AttendanceViewProps {
    session: Session;
}

const AttendanceView: React.FC<AttendanceViewProps> = ({ session }) => {
    const [todayStatus, setTodayStatus] = useState<AttendanceStatus | null>(null);
    const [history, setHistory] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    useEffect(() => {
        const fetchAttendanceData = async () => {
            setLoading(true);
            try {
                // Check today's status
                const { data: todayData, error: todayError } = await supabase
                    .from('attendance')
                    .select('status')
                    .eq('user_id', session.user.id)
                    .eq('date', today)
                    .single();
                
                if (todayError && todayError.code !== 'PGRST116') throw todayError;
                if (todayData) setTodayStatus(todayData.status as AttendanceStatus);

                // Fetch history
                const { data: historyData, error: historyError } = await supabase
                    .from('attendance')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .order('date', { ascending: false })
                    .limit(10);
                
                if (historyError) throw historyError;
                setHistory(historyData || []);

            } catch (error) {
                console.error("Error fetching attendance:", error);
                alert("Gagal memuat data absensi.");
            } finally {
                setLoading(false);
            }
        };

        fetchAttendanceData();
    }, [session.user.id, today]);

    const handleSetAttendance = async (status: AttendanceStatus) => {
        if (todayStatus) return; // Already submitted for today
        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('attendance')
                .insert({
                    user_id: session.user.id,
                    date: today,
                    status: status
                });
            if (error) throw error;
            setTodayStatus(status);
        } catch (error) {
            console.error("Error submitting attendance:", error);
            alert("Gagal menyimpan absensi. Mungkin Anda sudah absen hari ini.");
        } finally {
            setSubmitting(false);
        }
    };
    
    const getStatusBadge = (status: AttendanceStatus) => {
        switch (status) {
            case 'Hadir': return 'bg-green-100 text-green-800';
            case 'Sakit': return 'bg-yellow-100 text-yellow-800';
            case 'Izin': return 'bg-blue-100 text-blue-800';
            case 'Alpa': return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Absensi & Izin</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Card title="Catat Kehadiran Hari Ini">
                        {loading ? <Spinner /> : (
                            <div>
                                <p className="text-slate-600 mb-4">Tanggal: {new Date(today).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                {todayStatus ? (
                                    <div className="text-center p-4 rounded-lg bg-slate-100">
                                        <p className="font-semibold">Anda sudah absen hari ini dengan status:</p>
                                        <span className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(todayStatus)}`}>
                                            {todayStatus}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-500">Silakan pilih status kehadiran Anda untuk hari ini.</p>
                                        <button onClick={() => handleSetAttendance('Hadir')} disabled={submitting} className="w-full text-white bg-green-500 hover:bg-green-600 font-bold py-3 rounded-lg disabled:opacity-50">Hadir</button>
                                        <button onClick={() => handleSetAttendance('Sakit')} disabled={submitting} className="w-full text-white bg-yellow-500 hover:bg-yellow-600 font-bold py-3 rounded-lg disabled:opacity-50">Sakit</button>
                                        <button onClick={() => handleSetAttendance('Izin')} disabled={submitting} className="w-full text-white bg-blue-500 hover:bg-blue-600 font-bold py-3 rounded-lg disabled:opacity-50">Izin</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card title="Riwayat Absensi Terakhir">
                        {loading ? <Spinner /> : (
                            <div className="overflow-x-auto">
                                {history.length > 0 ? (
                                    <table className="min-w-full">
                                        <thead>
                                            <tr>
                                                <th className="py-2 px-4 bg-slate-50 text-left text-sm font-semibold text-slate-600">Tanggal</th>
                                                <th className="py-2 px-4 bg-slate-50 text-left text-sm font-semibold text-slate-600">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history.map(att => (
                                                <tr key={att.id} className="border-b">
                                                    <td className="py-3 px-4 text-sm text-slate-700">{new Date(att.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(att.status)}`}>{att.status}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : <p className="text-slate-500 text-center py-4">Belum ada riwayat absensi.</p>}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AttendanceView;