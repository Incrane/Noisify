'use client';

import { useState, useTransition, useEffect } from 'react';
import { Search, UserPlus, X, Check, Loader2, Mail, Users } from 'lucide-react';
import { toast } from 'sonner';
import { inviteMembers } from '@/app/staff/aktiviteter/actions';
import { getMembers } from '@/app/staff/medlemmar/actions';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface RegistrationManagerProps {
  activityId: string;
}

interface Member {
  id: string; // Membership ID
  profileId: string;
  alias: string;
  birthYear: number;
}

export default function StaffRegistrationManager({ activityId }: RegistrationManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedProfileIds, setSelectedProfileIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [orgId, setOrgId] = useState<string | null>(null);

  // Fetch activity's org ID
  useEffect(() => {
    const fetchOrgId = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('activity').select('owner_org_id').eq('id', activityId).single();
      if (data) setOrgId(data.owner_org_id);
    };
    if (isOpen) fetchOrgId();
  }, [activityId, isOpen]);

  // Fetch members when orgId is available
  useEffect(() => {
    const fetchMembers = async () => {
      if (!orgId) return;
      setIsLoading(true);
      try {
        // Fetch active members
        const data = await getMembers(orgId, query, 'active');
        setMembers(data as unknown as Member[]);
      } catch (error) {
        console.error(error);
        toast.error('Kunde inte hämta medlemmar');
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      if (isOpen) fetchMembers();
    }, 300);

    return () => clearTimeout(timer);
  }, [orgId, query, isOpen]);

  const toggleSelection = (profileId: string) => {
    const newSelected = new Set(selectedProfileIds);
    if (newSelected.has(profileId)) {
      newSelected.delete(profileId);
    } else {
      newSelected.add(profileId);
    }
    setSelectedProfileIds(newSelected);
  };

  const handleInvite = async () => {
    if (selectedProfileIds.size === 0) return;

    startTransition(async () => {
      try {
        const result = await inviteMembers(activityId, Array.from(selectedProfileIds));

        if (result.success) {
          toast.success(result.message);
          setIsOpen(false);
          setSelectedProfileIds(new Set());
          setQuery('');
        } else {
          toast.error(result.error);
        }
      } catch (error) {
        console.error(error);
        toast.error('Ett oväntat fel uppstod');
      }
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
      >
        <UserPlus className="w-4 h-4" /> Lägg till manuellt
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Bjud in medlemmar
          </h3>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Sök medlem..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              autoFocus
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-600 animate-spin" />
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {members.length === 0 && !isLoading && (
              <div className="text-center py-8 text-slate-500 text-sm">
                Inga aktiva medlemmar hittades.
              </div>
            )}

            {members.map((member) => {
              const isSelected = selectedProfileIds.has(member.profileId);
              return (
                <div
                  key={member.profileId}
                  onClick={() => toggleSelection(member.profileId)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                      ? 'bg-indigo-50 border-indigo-200'
                      : 'hover:bg-slate-50 border-transparent hover:border-slate-100'
                    }`}
                >
                  <div>
                    <div className="font-medium text-slate-900">{member.alias || 'Inget alias'}</div>
                    <div className="text-xs text-slate-500">Född {member.birthYear}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                    }`}>
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleInvite}
              disabled={selectedProfileIds.size === 0 || isPending}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Skickar inbjudningar...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" /> Bjud in {selectedProfileIds.size} valda
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
