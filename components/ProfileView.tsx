import React, { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Profile } from '../types';
import { supabase } from '../services/supabase';
import Card from './Card';
import Spinner from './Spinner';

interface ProfileViewProps {
    session: Session;
    profile: Profile;
}

const ProfileView: React.FC<ProfileViewProps> = ({ session, profile }) => {
    const [fullName, setFullName] = useState(profile.full_name);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Update full name in profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ full_name: fullName })
                .eq('id', session.user.id);
            
            if (profileError) throw profileError;

            setSuccess('Profil berhasil diperbarui!');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Password dan konfirmasi password tidak cocok.');
            return;
        }
        if (password.length < 6) {
            setError('Password minimal harus 6 karakter.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);
        
        try {
            const { error: passwordError } = await supabase.auth.updateUser({ password });
            if (passwordError) throw passwordError;
            setSuccess('Password berhasil diperbarui!');
            setPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Profil Saya</h1>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-6" role="alert">{success}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Informasi Akun">
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                         <div>
                            <label className="text-sm font-medium text-slate-700">Email</label>
                            <input type="email" value={session.user.email || ''} disabled className="mt-1 block w-full px-4 py-3 bg-slate-200 border border-slate-300 rounded-lg cursor-not-allowed"/>
                         </div>
                         <div>
                            <label htmlFor="fullName" className="text-sm font-medium text-slate-700">Nama Lengkap</label>
                            <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg"/>
                         </div>
                         <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300">
                            {loading ? <Spinner /> : 'Simpan Perubahan'}
                         </button>
                    </form>
                </Card>

                <Card title="Ganti Password">
                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                         <div>
                            <label htmlFor="password" className="text-sm font-medium text-slate-700">Password Baru</label>
                            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg"/>
                         </div>
                         <div>
                            <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Konfirmasi Password Baru</label>
                            <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg"/>
                         </div>
                         <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300">
                             {loading ? <Spinner /> : 'Ubah Password'}
                         </button>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default ProfileView;