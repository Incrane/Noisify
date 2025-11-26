"use client"

import { useState, useRef, useEffect } from "react"
import { X, ChevronDown, Search, Plus } from "lucide-react"

interface Option {
    id: string
    name: string
}

interface MultiSelectProps {
    options: Option[]
    selected: string[]
    onChange: (selected: string[]) => void
    placeholder?: string
    searchPlaceholder?: string
    onCreateNew?: () => void
    createNewLabel?: string
    disabled?: boolean
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = "Välj...",
    searchPlaceholder = "Search",
    onCreateNew,
    createNewLabel = "Skapa ny",
    disabled = false
}: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const selectedOptions = options.filter(opt => selected.includes(opt.id))
    const filteredOptions = options.filter(opt =>
        opt.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const toggleOption = (id: string) => {
        if (disabled) return
        if (selected.includes(id)) {
            onChange(selected.filter(s => s !== id))
        } else {
            onChange([...selected, id])
        }
    }

    const removeOption = (id: string) => {
        if (disabled) return
        onChange(selected.filter(s => s !== id))
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Selected Tags Display */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
                {selectedOptions.map(opt => (
                    <span key={opt.id} className={`px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 text-sm rounded-full flex items-center gap-1.5 transition-all ${disabled ? 'opacity-70' : ''}`}>
                        {opt.name}
                        {!disabled && (
                            <button
                                type="button"
                                onClick={() => removeOption(opt.id)}
                                className="hover:text-indigo-900 p-0.5 rounded-full hover:bg-indigo-100 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </span>
                ))}
            </div>

            {/* Dropdown Trigger */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full flex items-center justify-between px-4 py-3 bg-white border rounded-xl text-left transition-all duration-200 ${isOpen
                    ? 'border-indigo-500 ring-4 ring-indigo-500/10'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    } ${disabled ? 'bg-slate-50 cursor-not-allowed opacity-70' : ''}`}
            >
                <span className="text-slate-500 text-sm">{placeholder}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Panel */}
            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-80 overflow-hidden flex flex-col">
                    {/* Search Bar */}
                    <div className="p-3 border-b border-slate-100 shrink-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="overflow-y-auto flex-1 min-h-0">
                        {filteredOptions.length === 0 ? (
                            <div className="p-4 text-center text-slate-400 text-sm">Inga resultat</div>
                        ) : (
                            filteredOptions.map(opt => (
                                <label
                                    key={opt.id}
                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(opt.id)}
                                        onChange={() => toggleOption(opt.id)}
                                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-slate-700">{opt.name}</span>
                                </label>
                            ))
                        )}
                    </div>

                    {/* Create New Button */}
                    {onCreateNew && (
                        <div className="p-2 border-t border-slate-100 shrink-0 bg-white">
                            <button
                                type="button"
                                onClick={() => {
                                    onCreateNew()
                                    setIsOpen(false)
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                {createNewLabel}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
