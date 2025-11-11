import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { Profile, Material, Course, Assignment, Announcement, Notification } from '../types';
import { supabase } from '../services/supabase';
import { DashboardIcon, BookOpenIcon, ClipboardListIcon, CalendarIcon, UserCircleIcon, LogoutIcon, SearchIcon, DownloadIcon, ClockIcon, UploadIcon, BellIcon } from './icons';
import Spinner from './Spinner';
import Card from './Card';
import AttendanceView from './AttendanceView';
import ProfileView from './ProfileView';

interface StudentDashboardProps {
  session: Session;
  profile: Profile;
  onLogout: () => void;
}

type StudentView = 'dashboard' | 'materials' | 'assignments' | 'attendance' | 'profile';

const StudentDashboard: React.FC<StudentDashboardProps> = ({ session, profile, onLogout }) => {
    const [view, setView] = useState<StudentView>('dashboard');

    const renderView = () => {
        switch(view) {
            case 'dashboard':
                return <DashboardView session={session} />;
            case 'materials':
                return <MaterialsView />;
            case 'assignments':
                return <AssignmentsView />;
            case 'attendance':
                return <AttendanceView session={session} />;
            case 'profile':
                return <ProfileView session={session} profile={profile} />;
            default:
                // FIX: Cast `view` to string. Since all cases of `StudentView` are handled,
                // TypeScript narrows `view` to type `never` in the default case. This cast
                // allows the code to compile while retaining the fallback logic for any
                // future views that might be added to the `StudentView` type.
                const viewString = view as string;
                return <div className="p-8"><h2 className="text-2xl font-bold text-slate-800">{viewString.charAt(0).toUpperCase() + viewString.slice(1)}</h2><p>This feature is under construction.</p></div>
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
    currentView: StudentView;
    setView: (view: StudentView) => void;
    profile: Profile;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, profile, onLogout }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
        { id: 'materials', label: 'Materi', icon: <BookOpenIcon /> },
        { id: 'assignments', label: 'Tugas', icon: <ClipboardListIcon /> },
        { id: 'attendance', label: 'Absensi & Izin', icon: <CalendarIcon /> },
        { id: 'profile', label: 'Profil Saya', icon: <UserCircleIcon /> },
    ];

    return (
        <aside className="w-64 bg-white shadow-lg flex flex-col">
            <div className="p-6 text-center border-b">
                <h2 className="text-xl font-bold text-sky-700">SIAKAD MPLB</h2>
                <p className="text-sm text-slate-500">SMK LPPMRI 2 KEDUNGREJA</p>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map(item => (
                    <a
                        key={item.id}
                        href="#"
                        onClick={(e) => { e.preventDefault(); setView(item.id as StudentView); }}
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

// --- Dashboard View ---
const DashboardView: React.FC<{ session: Session }> = ({ session }) => {
    const [loading, setLoading] = useState(true);
    const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([]);
    const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
    const [unreadNotifications, setUnreadNotifications] = useState<number>(0);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch upcoming assignments
                const { data: assignmentsData, error: assignmentsError } = await supabase
                    .from('assignments')
                    .select('*, courses(course_name)')
                    .gt('due_date', new Date().toISOString())
                    .order('due_date', { ascending: true })
                    .limit(3);
                if (assignmentsError) throw assignmentsError;
                setUpcomingAssignments(assignmentsData || []);

                // Fetch recent announcements
                const { data: announcementsData, error: announcementsError } = await supabase
                    .from('announcements')
                    .select('*, profiles(full_name)')
                    .order('created_at', { ascending: false })
                    .limit(3);
                if (announcementsError) throw announcementsError;
                setRecentAnnouncements(announcementsData || []);

                // Fetch unread notifications count
                const { count, error: notificationsError } = await supabase
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', session.user.id)
                    .eq('is_read', false);
                if (notificationsError) throw notificationsError;
                setUnreadNotifications(count || 0);

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [session.user.id]);

    const getTimeDifference = (date: string) => {
        const now = new Date();
        const dueDate = new Date(date);
        const diffTime = dueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) return "Batas waktu hari ini";
        return `${diffDays} Hari Lagi`;
    };

    if (loading) {
        return <div className="p-8 h-full flex items-center justify-center"><Spinner /></div>;
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card title="Tugas Mendatang" icon={<ClipboardListIcon />}>
                         {upcomingAssignments.length > 0 ? (
                            <ul className="space-y-3">
                                {upcomingAssignments.map((a) => (
                                    <li key={a.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                        <div>
                                            <p className="font-semibold text-slate-700">{a.title}</p>
                                            <p className="text-sm text-slate-500">{a.courses.course_name}</p>
                                        </div>
                                        <span className="text-sm font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">{getTimeDifference(a.due_date)}</span>
                                    </li>
                                ))}
                            </ul>
                         ) : <p className="text-slate-500 text-center py-4">Tidak ada tugas mendatang.</p>}
                    </Card>
                    <Card title="Pengumuman Terbaru">
                         {recentAnnouncements.length > 0 ? (
                            <ul className="space-y-3">
                                {recentAnnouncements.map((a) => (
                                    <li key={a.id} className="p-3 border-b border-slate-100 last:border-b-0">
                                        <p className="font-semibold text-slate-700">{a.title}</p>
                                        <p className="text-xs text-slate-400">{a.profiles.full_name} - {new Date(a.created_at).toLocaleDateString()}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-slate-500 text-center py-4">Tidak ada pengumuman terbaru.</p>}
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card title="Absen Hari Ini" className="bg-sky-600 text-white">
                        <p className="text-sky-100 mb-4">Jangan lupa untuk konfirmasi kehadiranmu hari ini.</p>
                        <button className="w-full bg-white text-sky-600 font-bold py-3 px-4 rounded-lg hover:bg-sky-50 transition-colors">
                            Konfirmasi Kehadiran
                        </button>
                    </Card>
                     <Card title="Notifikasi Belum Dibaca" icon={<BellIcon />}>
                        <p className="text-center text-4xl font-bold text-sky-600">{unreadNotifications}</p>
                        <p className="text-center text-slate-500 mt-2">Notifikasi baru</p>
                    </Card>
                </div>
            </div>
        </div>
    );
}


// --- Materials View ---
const MaterialsView: React.FC = () => {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchMaterialsAndCourses = async () => {
            setLoading(true);
            try {
                const { data: coursesData, error: coursesError } = await supabase.from('courses').select('*');
                if (coursesError) throw coursesError;
                setCourses(coursesData || []);

                const { data: materialsData, error: materialsError } = await supabase.from('materials').select('*, courses(course_name)');
                if (materialsError) throw materialsError;
                setMaterials(materialsData || []);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMaterialsAndCourses();
    }, []);

    const filteredMaterials = materials
        .filter(m => selectedCourse === 'all' || m.course_id === selectedCourse)
        .filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()) || m.description?.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Materi Pembelajaran</h1>
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-grow w-full sm:w-auto">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Cari materi..." 
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select 
                    className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 bg-white"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                >
                    <option value="all">Semua Mata Pelajaran</option>
                    {courses.map(course => <option key={course.id} value={course.id}>{course.course_name}</option>)}
                </select>
            </div>
            {loading ? <Spinner /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMaterials.length > 0 ? filteredMaterials.map(material => (
                        <div key={material.id} className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between hover:shadow-lg transition-shadow">
                            <div>
                                <span className="text-xs font-semibold uppercase text-sky-600 bg-sky-100 px-2 py-1 rounded-full">{material.courses.course_name}</span>
                                <h3 className="text-lg font-bold text-slate-800 mt-3">{material.title}</h3>
                                {material.module && <p className="text-sm font-medium text-slate-500 mb-1">Modul: {material.module}</p>}
                                <p className="text-sm text-slate-600 mt-2 line-clamp-3">{material.description}</p>
                            </div>
                            {material.file_url && (
                                <button className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-sky-700 bg-sky-100 hover:bg-sky-200 font-semibold py-2 px-4 rounded-lg transition-colors">
                                    <DownloadIcon />
                                    Unduh Materi
                                </button>
                            )}
                        </div>
                    )) : <p className="text-slate-500 md:col-span-3 text-center">Tidak ada materi yang ditemukan.</p>}
                </div>
            )}
        </div>
    );
};

// --- Assignments View ---
const AssignmentsView: React.FC = () => {
     // Mock data for demonstration
    const activeAssignments = [
        { id: 1, title: 'Membuat Surat Lamaran Pekerjaan', course: 'Korespondensi', due_date: '2024-08-01T23:59:59', status: 'Belum dikumpulkan' },
        { id: 2, title: 'Laporan Keuangan Sederhana', course: 'Akuntansi Dasar', due_date: '2024-08-05T23:59:59', status: 'Belum dikumpulkan' },
    ];
    const historyAssignments = [
        { id: 3, title: 'Presentasi Produk', course: 'Pemasaran', status: 'Dinilai', grade: 85 },
        { id: 4, title: 'Analisis SWOT', course: 'Kewirausahaan', status: 'Dinilai', grade: 92 },
    ];

    const [activeTab, setActiveTab] = useState('active');

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Tugas & Penilaian</h1>
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'active' 
                            ? 'border-sky-500 text-sky-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        Tugas Aktif
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'history' 
                            ? 'border-sky-500 text-sky-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        Riwayat Tugas
                    </button>
                </nav>
            </div>

            <div className="mt-6">
                {activeTab === 'active' && (
                    <div className="space-y-4">
                        {activeAssignments.map(a => (
                            <Card key={a.id} title={a.title} className="!p-0">
                                <div className="p-6">
                                    <p className="text-sm text-slate-500 mb-3">{a.course}</p>
                                    <div className="flex items-center text-sm text-slate-600 gap-2">
                                        <ClockIcon className="text-slate-400" />
                                        <span>Batas Waktu: {new Date(a.due_date).toLocaleString()}</span>
                                    </div>
                                    <div className="mt-4">
                                        <label htmlFor={`file-upload-${a.id}`} className="cursor-pointer inline-flex items-center gap-2 text-sm text-white bg-sky-600 hover:bg-sky-700 font-semibold py-2 px-4 rounded-lg transition-colors">
                                            <UploadIcon/>
                                            Unggah Jawaban
                                        </label>
                                        <input id={`file-upload-${a.id}`} name={`file-upload-${a.id}`} type="file" className="sr-only" />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
                {activeTab === 'history' && (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tugas</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mata Pelajaran</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nilai</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {historyAssignments.map(a => (
                                    <tr key={a.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{a.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{a.course}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">{a.grade}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};


export default StudentDashboard;