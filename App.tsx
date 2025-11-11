import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { Session } from '@supabase/supabase-js';
import { Profile } from './types';
import LoginPage from './components/LoginPage';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import Spinner from './components/Spinner';
import PendingApprovalPage from './components/PendingApprovalPage';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        await fetchProfile(session);
      }
      setLoading(false);
    };

    getSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session) {
          setLoading(true);
          await fetchProfile(session);
          setLoading(false);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (currentSession: Session) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentSession.user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        throw error;
      }

      if (data) {
        setProfile(data);
      } else {
        // This case can happen if profile creation failed after sign up
        // or if the user was deleted from profiles but not auth.
        setProfile(null); 
        await supabase.auth.signOut(); // Log out the user for safety
      }

    } catch (error: any) {
      console.error('Error fetching profile:', error.message);
      // Log out the user if their profile is inaccessible
      await supabase.auth.signOut();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <Spinner />
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  if (profile) {
    if (profile.status === 'pending') {
      return <PendingApprovalPage onLogout={handleLogout} />;
    }

    if (profile.status === 'approved') {
      if (profile.role === 'Siswa') {
        return <StudentDashboard session={session} profile={profile} onLogout={handleLogout} />;
      }
      if (profile.role === 'Guru/Admin') {
        return <AdminDashboard session={session} profile={profile} onLogout={handleLogout} />;
      }
    }
  }

  // Fallback for unexpected states (e.g., rejected, no profile, unknown role)
  // This will briefly show while logging out or if something is wrong
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4 text-center">
      <h2 className="text-xl font-semibold text-slate-800">Terjadi Masalah</h2>
      <p className="text-slate-600 mt-2">
        Status akun Anda tidak dikenali atau profil Anda tidak dapat dimuat. Silakan coba masuk kembali.
      </p>
      <button onClick={handleLogout} className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors">
        Kembali ke Halaman Login
      </button>
    </div>
  );
};

export default App;