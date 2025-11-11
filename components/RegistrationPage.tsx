
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { UserRole } from '../types';

interface RegistrationPageProps {
    onBackToLogin: () => void;
}

const RegistrationPage: React.FC<RegistrationPageProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('Siswa');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Mendaftarkan pengguna baru dan mengirimkan metadata nama lengkap dan peran.
    // Pembuatan profil sekarang ditangani oleh trigger di database.
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        }
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Dengan trigger, kita tidak perlu lagi menyisipkan profil secara manual.
    // Database akan menanganinya secara otomatis.

    // Memeriksa apakah konfirmasi email diperlukan (pengaturan default Supabase).
    if (data.user && data.user.identities && data.user.identities.length === 0) {
        // Ini terjadi jika pengguna dengan email tersebut sudah ada tetapi belum dikonfirmasi.
        setSuccess("Pendaftaran Gagal: Pengguna sudah ada tetapi belum dikonfirmasi. Silakan periksa email Anda.");
    } else {
        setSuccess("Pendaftaran berhasil! Silakan periksa email Anda untuk verifikasi. Setelah itu, akun Anda akan menunggu persetujuan administrator.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 m-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Buat Akun Baru</h1>
          <p className="text-slate-500">Sistem Informasi Akademik</p>
        </div>
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">{error}</div>}
        {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-6" role="alert">{success}</div>}

        {!success && (
          <form onSubmit={handleRegister}>
            <div className="space-y-6">
              <div>
                <label htmlFor="fullName" className="text-sm font-medium text-slate-700">Nama Lengkap</label>
                <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg shadow-sm" />
              </div>
              <div>
                <label htmlFor="email-reg" className="text-sm font-medium text-slate-700">Email</label>
                <input id="email-reg" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg shadow-sm" />
              </div>
              <div>
                <label htmlFor="password-reg" className="text-sm font-medium text-slate-700">Password</label>
                <input id="password-reg" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg shadow-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Daftar sebagai</label>
                <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg shadow-sm">
                  <option value="Siswa">Siswa</option>
                  <option value="Guru/Admin">Guru / Admin</option>
                </select>
              </div>
            </div>
            <div className="mt-8">
              <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300">
                {loading ? 'Mendaftarkan...' : 'Daftar'}
              </button>
            </div>
          </form>
        )}
        
        <div className="text-center mt-6 text-sm">
          <p className="text-slate-600">
            Sudah punya akun?{' '}
            <button onClick={onBackToLogin} className="font-medium text-sky-600 hover:text-sky-500">
              Login di sini
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;
