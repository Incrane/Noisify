'use client';

import { useState, useTransition } from 'react';
import { X, Mail, UserPlus, Loader2 } from 'lucide-react';
import { inviteMember, createLocalMember } from './actions';
import { useRouter } from 'next/navigation';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';

interface NewMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
}

export default function NewMemberModal({ isOpen, onClose, orgId }: NewMemberModalProps) {
  const [activeTab, setActiveTab] = useState<'digital' | 'local'>('digital');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Digital Member State
  const [digitalEmail, setDigitalEmail] = useState('');
  const [digitalStartDate, setDigitalStartDate] = useState<Date | undefined>(new Date());
  const [digitalEndDate, setDigitalEndDate] = useState<Date | undefined>(undefined);

  // Local Member State
  const [localAlias, setLocalAlias] = useState('');
  const [localOrgIdNum, setLocalOrgIdNum] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const result = await inviteMember(
          orgId,
          digitalEmail,
          digitalStartDate ? format(digitalStartDate, 'yyyy-MM-dd') : '',
          digitalEndDate ? format(digitalEndDate, 'yyyy-MM-dd') : null
        );

        if (result.error) {
          alert(result.error);
        } else {
          onClose();
          setDigitalEmail('');
          setDigitalStartDate(new Date());
          setDigitalEndDate(undefined);
          router.refresh();
        }
      } catch (error) {
        console.error(error);
        alert('Ett fel uppstod vid inbjudan');
      }
    });
  };

  const handleCreateLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const result = await createLocalMember(orgId, localAlias, localOrgIdNum);
        if (result.error) {
          alert(result.error);
        } else {
          onClose();
          setLocalAlias('');
          setLocalOrgIdNum('');
          router.refresh();
        }
      } catch (error) {
        console.error(error);
        alert('Ett fel uppstod vid skapandet av lokal medlem');
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-slate-900">Ny medlem</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="p-4 pb-0">
          <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
            <button
              onClick={() => setActiveTab('digital')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all ${activeTab === 'digital'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Digital medlem
            </button>
            <button
              onClick={() => setActiveTab('local')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all ${activeTab === 'local'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Local medlem
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'digital' ? (
            <form onSubmit={handleInvite} className="space-y-6">
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                <h3 className="font-medium text-indigo-900 text-sm mb-1">Digital medlemskap</h3>
                <p className="text-indigo-600/80 text-xs">
                  Medlemmen får en inbjudan via e-post och kan logga in i systemet.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    E-post *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={digitalEmail}
                      onChange={(e) => setDigitalEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      placeholder="exempel@email.se"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Medlemskap från
                    </label>
                    <div className="relative">
                      <DatePicker
                        date={digitalStartDate}
                        setDate={setDigitalStartDate}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Till och med
                    </label>
                    <div className="relative">
                      <DatePicker
                        date={digitalEndDate}
                        setDate={setDigitalEndDate}
                        placeholder="Välj slutdatum"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-black text-white rounded-xl font-medium hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Bjuda in medlem
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreateLocal} className="space-y-6">
              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100/50">
                <h3 className="font-medium text-amber-900 text-sm mb-1">Local medlemskap</h3>
                <p className="text-amber-600/80 text-xs">
                  Medlemmen registreras manuellt och får inget konto i systemet.
                  Konto kan kopplas till ett digital medlem vid ett senare skede.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Alias *
                  </label>
                  <input
                    type="text"
                    required
                    value={localAlias}
                    onChange={(e) => setLocalAlias(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="Ange alias"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Verksamhetens ID nummer
                  </label>
                  <input
                    type="text"
                    value={localOrgIdNum}
                    onChange={(e) => setLocalOrgIdNum(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="T.ex. medlemsnummer"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-black text-white rounded-xl font-medium hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Skapa Local Medlem
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
