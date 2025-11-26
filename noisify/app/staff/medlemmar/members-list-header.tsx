'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function MembersListHeader({ onOpenModal }: { onOpenModal: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get('filter') || 'all';
  const currentSearch = searchParams.get('q') || '';

  const [searchTerm, setSearchTerm] = useState(currentSearch);

  useEffect(() => {
    // Only update if search term has changed from what's in the URL
    const currentQ = searchParams.get('q') || '';
    if (searchTerm === currentQ) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchTerm) {
        params.set('q', searchTerm);
      } else {
        params.delete('q');
      }
      router.push(`?${params.toString()}`);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, router, searchParams]);

  const handleFilterChange = (filter: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('filter', filter);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${currentFilter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Alla
          </button>
          <button
            onClick={() => handleFilterChange('active')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${currentFilter === 'active' ? 'bg-white text-emerald-600 shadow-sm flex items-center gap-2' : 'text-slate-600 hover:text-slate-900 flex items-center gap-2'
              }`}
          >
            {currentFilter === 'active' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            Aktiv
          </button>
          <button
            onClick={() => handleFilterChange('inactive')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${currentFilter === 'inactive' ? 'bg-white text-slate-900 shadow-sm flex items-center gap-2' : 'text-slate-600 hover:text-slate-900 flex items-center gap-2'
              }`}
          >
            {currentFilter === 'inactive' && <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
            Inaktiv
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Sök medlem..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
            />
          </div>

          <button
            onClick={onOpenModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors text-sm shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Ny medlem
          </button>
        </div>
      </div>
    </div>
  );
}
