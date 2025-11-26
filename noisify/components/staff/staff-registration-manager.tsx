'use client';

import { useState, useTransition } from 'react';
import { Search, UserPlus, X, Check, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { searchUsers, createRegistration } from '@/app/staff/aktiviteter/actions';

interface RegistrationManagerProps {
  activityId: string;
}

interface Profile {
  id: string;
  alias: string | null;
  fodd_ar: number | null;
}

export default function StaffRegistrationManager({ activityId }: RegistrationManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSearch = async (term: string) => {
    setQuery(term);
    if (term.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const users = await searchUsers(term);
      setResults(users);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAction = async (profileId: string, status: 'ACCEPTED' | 'INVITED') => {
    startTransition(async () => {
      try {
        const result = await createRegistration(activityId, profileId, status);

        if (result.success) {
          toast.success(result.message || 'Deltagare tillagd!');

          // Reset state
          setIsOpen(false);
          setQuery('');
          setResults([]);
        } else {
          toast.error(result.error || 'Ett fel uppstod');
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
          <h3 className="font-bold text-slate-900">Lägg till deltagare</h3>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Sök på alias..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-600 animate-spin" />
            )}
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[300px]">
            {results.length === 0 && query.length >= 2 && !isSearching && (
              <div className="text-center py-8 text-slate-500 text-sm">
                <p>Inga användare hittades med alias &quot;{query}&quot;</p>
                <p className="mt-1 text-xs text-slate-400">Prova ett annat alias</p>
              </div>
            )}

            {results.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors">
                <div>
                  <div className="font-medium text-slate-900">{user.alias || 'Inget alias'}</div>
                  <div className="text-xs text-slate-500">Född {user.fodd_ar}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={isPending}
                    onClick={() => handleAction(user.id, 'INVITED')}
                    className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Bjud in"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                  <button
                    disabled={isPending}
                    onClick={() => handleAction(user.id, 'ACCEPTED')}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Lägg till direkt"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
