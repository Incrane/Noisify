'use client';

import { useState } from 'react';
import { X, Mail, User } from 'lucide-react';
import { inviteStaff } from '@/app/staff/verksamhet/personal/actions';

interface NewStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
}

export default function NewStaffModal({ isOpen, onClose, orgId }: NewStaffModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await inviteStaff(orgId, email, firstName, lastName);
      if (result.success) {
        setSuccess(result.message || 'Inbjudan skickad!');
        // Reset form
        setFirstName('');
        setLastName('');
        setEmail('');
        // Close after a short delay to show success
        setTimeout(() => {
          onClose();
          setSuccess(null);
        }, 1500);
      } else {
        setError('Ett fel uppstod vid inbjudan.');
      }
    } catch (err) {
      console.error(err);
      setError('Ett oväntat fel uppstod.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <User className="w-5 h-5" />
            </div>
            Ny personal
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-base font-medium text-slate-900">Bjud in ny personal till verksamheten</h3>
            <p className="text-sm text-slate-500 mt-1">
              Medlemmen får en inbjudan via e-post eller mobilnummer och kan logga in i systemet.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Förnamn <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Efternamn
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                E-post <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 text-emerald-600 text-sm rounded-lg">
                {success}
              </div>
            )}

            <div className="flex justify-start pt-2">
              <button
                type="submit"
                disabled={isLoading || !!success}
                className="px-5 py-2.5 bg-black text-white rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Skickar...
                  </>
                ) : success ? (
                  'Skickat!'
                ) : (
                  'Bjud in'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
