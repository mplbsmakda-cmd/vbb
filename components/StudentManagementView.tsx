import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import Card from './Card';
import Spinner from './Spinner';
import { SearchIcon, TrashIcon } from './icons';

const StudentManagementView: React.FC = () => {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .in('status', ['approved', 'rejected']); // Fetch all non-pending users
            
            if (error) throw error;
            setUsers(data || []);
        } catch (err: any) {
            setError('Gagal memuat data pengguna.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    const handleDeleteUser = async (userId: string, userEmail: string | undefined) => {
        if (!window.confirm(`PERINGATAN: Anda akan menghapus pengguna ${userEmail}. Aksi ini akan menghapus profil mereka dan tidak dapat dibatalkan. Lanjutkan?`)) return;

        try {
            // As warned before, client-side deletion from auth.users is not secure/possible by default.
            // This will only delete the profile, effectively blocking them.
            // An Edge Function is required for full user deletion.
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);
            
            if (error) throw error;

            setUsers(prev => prev.filter(u => u.id !== userId));
            alert(`Profil untuk ${userEmail} telah dihapus.`);
        } catch (err: any) {
            alert('Gagal menghapus pengguna.');
            console.error(err);
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user =>
            user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.pending_email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Manajemen Siswa & Guru</h1>
            <p className="text-slate-600 mb-6">Lihat, cari, dan kelola semua pengguna terdaftar.</p>
            
            <Card title={`Semua Pengguna (${filteredUsers.length})`}>
                <div className="mb-4">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari berdasarkan nama atau email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                        />
                    </div>
                </div>

                {loading && <Spinner />}
                {error && <p className="text-red-500">{error}</p>}
                
                {!loading && !error && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nama Lengkap</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Peran</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.full_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.pending_email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.role}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(user.status)}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                            <button 
                                                onClick={() => handleDeleteUser(user.id, user.pending_email)}
                                                className="text-red-600 hover:text-red-900 transition-colors"
                                                title="Hapus Pengguna"
                                            >
                                               <TrashIcon />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default StudentManagementView;