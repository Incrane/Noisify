'use client'

import { useState, useEffect } from 'react'
import { Search, X, Loader2, Plus } from 'lucide-react'
import { searchEntities, addFavorite, FavoriteType } from './actions'

interface AddFavoriteModalProps {
    isOpen: boolean
    onClose: () => void
    type: FavoriteType
    onAdded: () => void
}

export default function AddFavoriteModal({ isOpen, onClose, type, onAdded }: AddFavoriteModalProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [addingId, setAddingId] = useState<string | null>(null)

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length >= 2) {
                setLoading(true)
                try {
                    const data = await searchEntities(type, query)
                    setResults(data)
                } catch (error) {
                    console.error(error)
                } finally {
                    setLoading(false)
                }
            } else {
                setResults([])
            }
        }, 300)

        return () => clearTimeout(delayDebounceFn)
    }, [query, type])

    const handleAdd = async (id: string) => {
        setAddingId(id)
        try {
            await addFavorite(type, id)
            onAdded()
            onClose()
            setQuery('')
            setResults([])
        } catch (error) {
            console.error(error)
        } finally {
            setAddingId(null)
        }
    }

    if (!isOpen) return null

    const titleMap: Record<FavoriteType, string> = {
        activity: 'Lägg till aktivitet',
        course: 'Lägg till kurs',
        organization: 'Lägg till organisation'
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-semibold text-lg text-slate-900">{titleMap[type]}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Sök..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 p-2">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                        </div>
                    ) : results.length > 0 ? (
                        <div className="space-y-1">
                            {results.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleAdd(item.id)}
                                    disabled={addingId === item.id}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-slate-400 font-medium text-lg">
                                                {item.name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-slate-900 truncate">{item.name}</h4>
                                    </div>
                                    {addingId === item.id ? (
                                        <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                                    ) : (
                                        <Plus className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : query.length >= 2 ? (
                        <div className="text-center py-8 text-slate-500">
                            Inga resultat hittades
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            Skriv minst 2 tecken för att söka
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
