import React from 'react';
import { HourglassIcon } from './icons';

interface PendingApprovalPageProps {
  onLogout: () => void;
}

const PendingApprovalPage: React.FC<PendingApprovalPageProps> = ({ onLogout }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4 text-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="flex justify-center mb-6">
            <HourglassIcon className="w-16 h-16 text-sky-500 animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Pendaftaran Anda Sedang Ditinjau</h1>
        <p className="text-slate-600 mt-4">
          Terima kasih telah mendaftar. Akun Anda sedang menunggu persetujuan dari administrator.
          Anda akan dapat masuk setelah akun Anda disetujui.
        </p>
        <div className="mt-8">
          <button
            onClick={onLogout}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingApprovalPage;