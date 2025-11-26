'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Building2 } from 'lucide-react';
import { createOrganization } from '@/actions/onboarding-actions';
import { selectOrganization } from '@/app/staff/actions';
import { useRouter } from 'next/navigation';

interface CreateOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateOrgModal({ isOpen, onClose }: CreateOrgModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgAddress, setOrgAddress] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('orgName', orgName);
      formData.append('orgAddress', orgAddress);
      formData.append('contactEmail', contactEmail);
      formData.append('contactPhone', contactPhone);

      const result = await createOrganization(formData);

      if (result.success && result.orgId) {
        setSuccess('Organisation skapad! Vidarebefordrar till onboarding...');

        // Select the new org
        await selectOrganization(result.orgId);

        // Reset form
        setOrgName('');
        setOrgAddress('');
        setContactEmail('');
        setContactPhone('');

        // Redirect to onboarding
        setTimeout(() => {
          onClose();
          router.push('/staff/onboarding');
          setSuccess(null);
        }, 1000);
      } else {
        setError(result.error || 'Ett fel uppstod.');
      }
    } catch (err) {
      console.error(err);
      setError('Ett oväntat fel uppstod.');
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Building2 className="w-5 h-5" />
            </div>
            Ny verksamhet
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
            <h3 className="text-base font-medium text-slate-900">Skapa en ny verksamhet</h3>
            <p className="text-sm text-slate-500 mt-1">
              Ange uppgifter för den nya verksamheten. Du blir automatiskt administratör.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Namn <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="T.ex. Ungdomens Hus"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Adress
              </label>
              <input
                type="text"
                value={orgAddress}
                onChange={(e) => setOrgAddress(e.target.value)}
                placeholder="Gatunamn 1, 412 34 Göteborg"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  E-post
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="info@org.se"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="031-123 45 67"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors mr-2"
              >
                Avbryt
              </button>
              <button
                type="submit"
                disabled={isLoading || !!success}
                className="px-5 py-2.5 bg-black text-white rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Skapar...
                  </>
                ) : success ? (
                  'Skapad!'
                ) : (
                  'Skapa verksamhet'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
