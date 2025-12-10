'use client';

import { useState, useTransition } from 'react';
import NewMemberModal from './new-member-modal';
import MemberDetailsModal from '@/components/staff/member-details-modal';
import MembersListHeader from './members-list-header';
import { Calendar, Info, Users as UsersIcon, CheckCircle, XCircle, Loader2, ShieldCheck, Shield } from 'lucide-react';
import { updateMemberStatus } from './actions';
import { toast } from 'sonner';

interface Member {
  id: string;
  profileId: string;
  alias: string;
  userId: string | null;
  status: string;
  startDate: string;
  endDate: string | null;
  isLocal: boolean;
  birthYear: number | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  verk_id_nummer?: string | null;
  notes?: string | null;
  birth_date?: string | null;
  isVerified?: boolean;
}

interface MembersPageClientProps {
  members: Member[];
  orgId: string;
  filter: string;
}

export default function MembersPageClient({ members, orgId, filter }: MembersPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleStatusUpdate = async (memberId: string, status: 'active' | 'rejected') => {
    setPendingId(memberId);
    startTransition(async () => {
      const result = await updateMemberStatus(memberId, status, orgId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(status === 'active' ? 'Medlemskap godkänt' : 'Medlemskap avvisat');
      }
      setPendingId(null);
    });
  };

  return (
    <div className="space-y-6">
      <MembersListHeader onOpenModal={() => setIsModalOpen(true)} />

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Desktop Table */}
        <table className="w-full text-left text-sm hidden md:table">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-medium text-slate-500">Medlem</th>
              <th className="px-6 py-4 font-medium text-slate-500">Status</th>
              <th className="px-6 py-4 font-medium text-slate-500">Detaljer</th>
              <th className="px-6 py-4 font-medium text-slate-500">Konto typ</th>
              <th className="px-6 py-4 font-medium text-slate-500 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm
                        ${member.isLocal ? 'bg-amber-500' : 'bg-indigo-500'}`}>
                        {member.alias.charAt(0).toUpperCase()}
                      </div>
                      {/* Verified Badge */}
                      {member.isVerified ? (
                        <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5" title="Verifierad profil">
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        </div>
                      ) : (
                        <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5" title="Overifierad profil">
                          <Shield className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{member.alias}</div>
                      <div className="text-xs text-slate-500 font-mono">ID: {member.profileId.slice(0, 8)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1.5
                    ${member.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : member.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500'
                      : member.status === 'pending' ? 'bg-amber-500'
                        : 'bg-slate-400'}`} />
                    {member.status === 'active' ? 'Aktiv'
                      : member.status === 'pending' ? 'Väntar svar'
                        : 'Inaktiv'}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  <div className="space-y-1">
                    {member.birthYear && (
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Född {member.birthYear}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium
                    ${member.isLocal
                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>
                    {member.isLocal ? 'Local' : 'Digital'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {member.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(member.id, 'active')}
                          disabled={isPending}
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-1.5 rounded-full transition-colors disabled:opacity-50"
                          title="Godkänn"
                        >
                          {isPending && pendingId === member.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(member.id, 'rejected')}
                          disabled={isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-full transition-colors disabled:opacity-50"
                          title="Avvisa"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <MemberDetailsModal member={member} orgId={orgId}>
                      <button className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 hover:bg-slate-100 rounded-full">
                        <Info className="w-4 h-4" />
                      </button>
                    </MemberDetailsModal>
                  </div>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <UsersIcon className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="font-medium">Inga medlemmar hittades</p>
                    <p className="text-xs text-slate-400 mt-1">Prova att ändra filter eller sökterm</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {members.map((member) => (
            <div key={member.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm
                                  ${member.isLocal ? 'bg-amber-500' : 'bg-indigo-500'}`}>
                      {member.alias.charAt(0).toUpperCase()}
                    </div>
                    {/* Verified Badge - Mobile */}
                    {member.isVerified ? (
                      <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5" title="Verifierad profil">
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      </div>
                    ) : (
                      <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5" title="Overifierad profil">
                        <Shield className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{member.alias}</div>
                    <div className="text-xs text-slate-500 font-mono">ID: {member.profileId.slice(0, 8)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {member.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(member.id, 'active')}
                        disabled={isPending}
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-1.5 rounded-full transition-colors disabled:opacity-50"
                      >
                        {isPending && pendingId === member.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(member.id, 'rejected')}
                        disabled={isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-full transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <MemberDetailsModal member={member} orgId={orgId}>
                    <button className="text-slate-400 hover:text-indigo-600 transition-colors p-1">
                      <Info className="w-5 h-5" />
                    </button>
                  </MemberDetailsModal>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1.5
                            ${member.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : member.status === 'pending'
                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                      : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500'
                    : member.status === 'pending' ? 'bg-amber-500'
                      : 'bg-slate-400'}`} />
                  {member.status === 'active' ? 'Aktiv'
                    : member.status === 'pending' ? 'Väntar svar'
                      : 'Inaktiv'}
                </span>

                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium
                            ${member.isLocal
                    ? 'bg-amber-50 text-amber-700 border border-amber-100'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>
                  {member.isLocal ? 'Local' : 'Digital'}
                </span>
              </div>

              {member.birthYear && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Född {member.birthYear}
                </div>
              )}
            </div>
          ))}
          {members.length === 0 && (
            <div className="p-8 text-center">
              <div className="flex flex-col items-center justify-center text-slate-500">
                <UsersIcon className="w-12 h-12 text-slate-300 mb-3" />
                <p className="font-medium">Inga medlemmar hittades</p>
                <p className="text-xs text-slate-400 mt-1">Prova att ändra filter eller sökterm</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <NewMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        orgId={orgId}
      />
    </div>
  );
}
