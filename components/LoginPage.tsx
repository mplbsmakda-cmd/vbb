
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import RegistrationPage from './RegistrationPage';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // The parent component will handle the session change and routing
    } catch (err: any) {
      setError(err.error_description || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isRegistering) {
    return <RegistrationPage onBackToLogin={() => setIsRegistering(false)} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 m-4">
        <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Sistem Informasi Akademik</h1>
            <p className="text-slate-500">SMK LPPMRI 2 KEDUNGREJA</p>
        </div>
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>
          <div className="mt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-sky-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
        <div className="text-center mt-6 text-sm">
            <p className="text-slate-600">
                Belum punya akun?{' '}
                <button onClick={() => setIsRegistering(true)} className="font-medium text-sky-600 hover:text-sky-500">
                    Daftar di sini
                </button>
            </p>
            <a href="#" className="mt-2 inline-block text-sky-600 hover:text-sky-500">Lupa Password?</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;