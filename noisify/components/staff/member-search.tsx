'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, User, Loader2, X } from 'lucide-react'
import { getMembers } from '@/app/staff/medlemmar/actions'
// import { useDebounce } from '@/hooks/use-debounce'

export interface Member {
    id: string
    profileId: string
    alias: string
    email?: string
    status: string
}

interface MemberSearchProps {
    orgId: string
    onSelect: (member: Member | null) => void
    selectedMember?: Member | null
}

export default function MemberSearch({ orgId, onSelect, selectedMember }: MemberSearchProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Member[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)

    // Fetch members on mount and when query changes
    useEffect(() => {
        const fetchMembers = async () => {
            setIsLoading(true)
            try {
                // Fetch all members (active and inactive)
                const members = await getMembers(orgId, query, 'all')
                setResults(members)
            } catch (error) {
                console.error('Failed to search members', error)
            } finally {
                setIsLoading(false)
            }
        }

        const timer = setTimeout(() => {
            fetchMembers()
        }, 300)

        return () => clearTimeout(timer)
    }, [query, orgId])

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    if (selectedMember) {
        return (
            <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                        <User className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-indigo-900">{selectedMember.alias}</p>
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-indigo-600">Medlem</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${selectedMember.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-slate-100 text-slate-600'
                                }`}>
                                {selectedMember.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => onSelect(null)}
                    className="p-1 text-indigo-400 hover:text-indigo-600 rounded-full hover:bg-indigo-100"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        )
    }

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Sök medlem..."
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                )}
            </div>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-slate-100 max-h-60 overflow-y-auto">
                    {results.length > 0 ? (
                        results.map((member) => (
                            <button
                                key={member.id}
                                type="button"
                                onClick={() => {
                                    onSelect(member)
                                    setQuery('')
                                    setIsOpen(false)
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors border-b border-slate-50 last:border-0"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{member.alias}</p>
                                    </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${member.status === 'active'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {member.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                                </span>
                            </button>
                        ))
                    ) : (
                        !isLoading && (
                            <div className="p-4 text-center text-sm text-slate-500">
                                Inga medlemmar hittades
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    )
}
