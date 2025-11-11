import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { Profile, UserRole } from '../types';
import { supabase } from '../services/supabase';
import { ChartBarIcon, UsersIcon, BookOpenIcon, ClipboardListIcon, LogoutIcon, UserCircleIcon, ShieldCheckIcon, CheckCircleIcon, XCircleIcon } from './icons';
import Card from './Card';
import Spinner from './Spinner';
import StudentManagementView from './StudentManagementView';

// Add a global declaration for window.Recharts to resolve TypeScript error.
declare global {
  interface Window {
    Recharts: any;
  }
}

interface AdminDashboardProps {
  session: Session;
  profile: Profile;
  onLogout: () => void;
}

type AdminView = 'dashboard' | 'students' | 'academic' | 'grading' | 'registration';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ session, profile, onLogout }) => {
    const [view, setView] = useState<AdminView>('dashboard');

     const renderView = () => {
        switch(view) {
            case 'dashboard':
                return <AnalyticsView />;
            case 'registration':
                return <RegistrationManagementView session={session} />;
            case 'students':
                return <StudentManagementView />;
            default:
                return <div className="p-8"><h2 className="text-2xl font-bold text-slate-800">{view.charAt(0).toUpperCase() + view.slice(1)}</h2><p>This feature is under construction.</p></div>
        }
    };

    return (
        <div className="flex h-screen bg-slate-100">
            <Sidebar currentView={view} setView={setView} profile={profile} onLogout={onLogout} />
            <main className="flex-1 overflow-y-auto">
                {renderView()}
            </main>
        </div>
    );
};

// --- Sidebar Component ---
interface SidebarProps {
    currentView: AdminView;
    setView: (view: AdminView) => void;
    profile: Profile;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, profile, onLogout }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <ChartBarIcon /> },
        { id: 'registration', label: 'Manajemen Pendaftaran', icon: <ShieldCheckIcon /> },
        { id: 'students', label: 'Manajemen Siswa', icon: <UsersIcon /> },
        { id: 'academic', label: 'Manajemen Akademik', icon: <BookOpenIcon /> },
        { id: 'grading', label: 'Penilaian Tugas', icon: <ClipboardListIcon /> },
    ];

    return (
        <aside className="w-64 bg-white shadow-lg flex flex-col">
            <div className="p-6 text-center border-b">
                <h2 className="text-xl font-bold text-sky-700">ADMIN PANEL</h2>
                <p className="text-sm text-slate-500">SIAKAD MPLB</p>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map(item => (
                    <a
                        key={item.id}
                        href="#"
                        onClick={(e) => { e.preventDefault(); setView(item.id as AdminView); }}
                        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                            currentView === item.id 
                                ? 'bg-sky-100 text-sky-700' 
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                        {React.cloneElement(item.icon, { className: 'w-5 h-5 mr-3' })}
                        <span>{item.label}</span>
                    </a>
                ))}
            </nav>
            <div className="p-4 border-t">
                 <div className="flex items-center mb-4">
                    <UserCircleIcon className="w-10 h-10 text-slate-400" />
                    <div className="ml-3">
                        <p className="text-sm font-semibold text-slate-800">{profile.full_name}</p>
                        <p className="text-xs text-slate-500">{profile.role}</p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors duration-200"
                >
                    <LogoutIcon className="w-5 h-5 mr-2" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

// --- Registration Management View ---
const RegistrationManagementView: React.FC<{ session: Session }> = ({ session }) => {
    const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('status', 'pending');
            if (error) throw error;
            setPendingUsers(data || []);
        } catch (err: any) {
            setError('Gagal memuat data pendaftar.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId: string) => {
        if (!window.confirm('Apakah Anda yakin ingin menyetujui pengguna ini?')) return;
        setUpdatingId(userId);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ status: 'approved' })
                .eq('id', userId);
            if (error) throw error;
            setPendingUsers(prev => prev.filter(p => p.id !== userId));
        } catch (err: any) {
            alert('Gagal menyetujui pengguna.');
            console.error(err);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleReject = async (userId: string, userEmail: string | undefined) => {
        if (!window.confirm('PERINGATAN: Menolak pengguna akan menghapus akun dan data mereka secara permanen. Aksi ini tidak dapat dibatalkan. Lanjutkan?')) return;
        setUpdatingId(userId);
        try {
            // NOTE: Deleting a user from `auth.users` requires admin privileges
            // and should ideally be done via a Supabase Edge Function for security.
            // The following `supabase.auth.admin.deleteUser` will FAIL on the client-side
            // without the correct setup. For this example, we will focus on deleting
            // the profile record, which makes the user unable to log in.
            // In a real production app, an Edge Function is a MUST.

            // 1. Delete the public profile
            const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);
            
            if (profileError) throw profileError;

            // 2. (Optional but recommended) Call an edge function to delete the auth user
            // Example: await supabase.functions.invoke('delete-user', { body: { userId } });

            alert(`Profil untuk ${userEmail} telah dihapus. Untuk penghapusan penuh, hapus pengguna dari Supabase Auth panel.`);
            setPendingUsers(prev => prev.filter(p => p.id !== userId));

        } catch (err: any) {
            alert('Gagal menolak pengguna.');
            console.error(err);
        } finally {
            setUpdatingId(null);
        }
    };


    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Manajemen Pendaftaran</h1>
            <p className="text-slate-600 mb-6">Setujui atau tolak pendaftaran siswa dan guru baru.</p>

            {loading && <Spinner />}
            {error && <p className="text-red-500">{error}</p>}
            
            {!loading && !error && (
                <Card title={`Pendaftaran Tertunda (${pendingUsers.length})`} className="lg:col-span-3">
                    {pendingUsers.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nama Lengkap</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Peran</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {pendingUsers.map((user) => (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.full_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.pending_email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'Siswa' ? 'bg-sky-100 text-sky-800' : 'bg-indigo-100 text-indigo-800'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                                <button 
                                                    onClick={() => handleApprove(user.id)}
                                                    disabled={updatingId === user.id}
                                                    className="inline-flex items-center gap-1 text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-wait mr-4 transition-colors"
                                                >
                                                   <CheckCircleIcon /> Setujui
                                                </button>
                                                <button 
                                                    onClick={() => handleReject(user.id, user.pending_email)}
                                                    disabled={updatingId === user.id}
                                                    className="inline-flex items-center gap-1 text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-wait transition-colors"
                                                >
                                                   <XCircleIcon/> Tolak
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-center text-slate-500 py-8">Tidak ada pendaftaran yang menunggu persetujuan.</p>
                    )}
                </Card>
            )}
        </div>
    );
};


// --- Analytics View ---
const AnalyticsView: React.FC = () => {
    const [rechartsLoaded, setRechartsLoaded] = useState(false);
    const [stats, setStats] = useState({ students: 0, teachers: 0, pending: 0 });
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
      const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const { count: students, error: studentsError } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'Siswa').eq('status', 'approved');
            if(studentsError) throw studentsError;

            const { count: teachers, error: teachersError } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'Guru/Admin').eq('status', 'approved');
            if(teachersError) throw teachersError;

            const { count: pending, error: pendingError } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending');
            if(pendingError) throw pendingError;
            
            setStats({ students: students || 0, teachers: teachers || 0, pending: pending || 0 });
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoadingStats(false);
        }
      };

      fetchStats();
    }, []);

    useEffect(() => {
        if (window.Recharts) {
            setRechartsLoaded(true);
            return;
        }
        
        const intervalId = setInterval(() => {
            if (window.Recharts) {
                setRechartsLoaded(true);
                clearInterval(intervalId);
            }
        }, 100);

        return () => clearInterval(intervalId);
    }, []);


    if (!rechartsLoaded) {
        return (
             <div className="p-8 h-full flex flex-col">
                <h1 className="text-3xl font-bold text-slate-800 mb-6">Dashboard Analitik</h1>
                <div className="flex-grow flex justify-center items-center">
                    <Spinner />
                </div>
            </div>
        );
    }
    
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = window.Recharts;

    const attendanceData = [
        { name: 'Senin', Hadir: 28, Izin: 2, Alpa: 1 },
        { name: 'Selasa', Hadir: 30, Izin: 1, Alpa: 0 },
        { name: 'Rabu', Hadir: 29, Izin: 1, Alpa: 1 },
        { name: 'Kamis', Hadir: 31, Izin: 0, Alpa: 0 },
        { name: 'Jumat', Hadir: 27, Izin: 3, Alpa: 1 },
    ];
    
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Dashboard Analitik</h1>
            
            {loadingStats ? <Spinner /> : (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card title="Total Siswa Aktif" icon={<UsersIcon />}>
                        <p className="text-3xl font-bold text-sky-600">{stats.students}</p>
                    </Card>
                    <Card title="Total Guru & Admin" icon={<UserCircleIcon />}>
                        <p className="text-3xl font-bold text-indigo-600">{stats.teachers}</p>
                    </Card>
                    <Card title="Pendaftar Tertunda" icon={<ShieldCheckIcon />}>
                        <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                <Card title="Tingkat Kehadiran Minggu Ini" className="lg:col-span-2">
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={attendanceData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Hadir" fill="#0ea5e9" />
                                <Bar dataKey="Izin" fill="#f59e0b" />
                                <Bar dataKey="Alpa" fill="#ef4444" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;