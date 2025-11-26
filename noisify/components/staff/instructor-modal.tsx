'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Search, Check, Upload, Edit2 } from 'lucide-react'

interface Instructor {
    id: string
    name: string
    title: string | null
    image_url: string | null
    email?: string | null
    phone?: string | null
    is_external?: boolean
}

interface InstructorModalProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (selectedIds: string[], newInstructors?: Instructor[]) => void
    availableInstructors: Instructor[]
    organizationStaff?: Instructor[]
    preSelectedIds: string[]
    orgId: string
    onCreateExternal: (data: FormData, orgId: string) => Promise<Instructor | null>
    onUpdateExternal?: (id: string, data: FormData) => Promise<Instructor | null>
    onPromoteStaff?: (staff: { name: string, title?: string | null, image_url?: string | null, email?: string | null, phone?: string | null }, orgId: string) => Promise<Instructor | null>
}

export default function InstructorModal({
    isOpen,
    onClose,
    onSelect,
    availableInstructors,
    organizationStaff = [],
    preSelectedIds,
    orgId,
    onCreateExternal,
    onUpdateExternal,
    onPromoteStaff
}: InstructorModalProps) {
    const [activeTab, setActiveTab] = useState('instructors')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedIds, setSelectedIds] = useState<string[]>(preSelectedIds)
    const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])
    const [isCreating, setIsCreating] = useState(false)
    const [isPromoting, setIsPromoting] = useState(false)

    // State for external instructor form
    const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [previewImage, setPreviewImage] = useState<string | null>(null)

    useEffect(() => {
        setSelectedIds(preSelectedIds)
    }, [preSelectedIds])

    useEffect(() => {
        if (isOpen) {
            setEditingInstructor(null)
            setPreviewImage(null)
            setActiveTab('instructors')
            setSearchQuery('')
            setSelectedStaffIds([])
        }
    }, [isOpen])

    const filteredInstructors = availableInstructors.filter(inst => {
        const matchesSearch = inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (inst.title && inst.title.toLowerCase().includes(searchQuery.toLowerCase()))
        return matchesSearch
    })

    const filteredStaff = organizationStaff.filter(inst => {
        const matchesSearch = inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (inst.title && inst.title.toLowerCase().includes(searchQuery.toLowerCase()))
        return matchesSearch
    })

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        )
    }

    const toggleStaffSelection = (id: string) => {
        setSelectedStaffIds(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        )
    }

    const handleSaveExternal = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsCreating(true)
        const formData = new FormData(e.currentTarget)

        try {
            let result: Instructor | null = null

            if (editingInstructor && onUpdateExternal) {
                result = await onUpdateExternal(editingInstructor.id, formData)
            } else {
                result = await onCreateExternal(formData, orgId)
            }

            if (result) {
                if (editingInstructor) {
                    // Update local list if needed, but usually parent re-fetches or we update local state
                    // For now, just select it
                    if (!selectedIds.includes(result.id)) {
                        toggleSelection(result.id)
                    }
                    // We might want to update the availableInstructors list in parent, 
                    // but onSelect with newInstructors handles addition. 
                    // For update, we might need to pass updated instructor back.
                    onSelect(selectedIds, [result])
                } else {
                    toggleSelection(result.id)
                    onSelect([...selectedIds, result.id], [result])
                }

                setActiveTab('instructors')
                setEditingInstructor(null)
                setPreviewImage(null)
            }
        } catch (error) {
            console.error("Error saving instructor:", error)
        } finally {
            setIsCreating(false)
        }
    }

    const handleSelect = async () => {
        setIsPromoting(true)
        try {
            const newInstructorIds: string[] = []
            const newInstructors: Instructor[] = []

            // Promote selected staff
            if (onPromoteStaff && selectedStaffIds.length > 0) {
                for (const staffId of selectedStaffIds) {
                    const staffMember = organizationStaff.find(s => s.id === staffId)
                    if (staffMember) {
                        const promoted = await onPromoteStaff({
                            name: staffMember.name,
                            title: staffMember.title,
                            image_url: staffMember.image_url,
                            email: staffMember.email,
                            phone: staffMember.phone
                        }, orgId)
                        if (promoted) {
                            newInstructorIds.push(promoted.id)
                            newInstructors.push(promoted)
                        }
                    }
                }
            }

            onSelect([...selectedIds, ...newInstructorIds], newInstructors)
            onClose()
        } catch (e) {
            console.error("Error promoting staff", e)
        } finally {
            setIsPromoting(false)
        }
    }

    const handleEditClick = (inst: Instructor) => {
        setEditingInstructor(inst)
        setPreviewImage(inst.image_url)
        setActiveTab('external')
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const url = URL.createObjectURL(file)
            setPreviewImage(url)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">
                        {activeTab === 'external' ? (editingInstructor ? 'Redigera instruktör' : 'Ny instruktör') : 'Välj instruktör'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-2 flex gap-2 border-b border-slate-100 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('instructors')}
                        className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'instructors' ? 'bg-white shadow-sm text-slate-900 ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        Instruktörer
                    </button>
                    <button
                        onClick={() => setActiveTab('staff')}
                        className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'staff' ? 'bg-white shadow-sm text-slate-900 ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        Personal
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('external')
                            setEditingInstructor(null)
                            setPreviewImage(null)
                        }}
                        className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'external' ? 'bg-white shadow-sm text-slate-900 ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        + Extern instruktör
                    </button>
                </div>

                {activeTab === 'instructors' && (
                    <>
                        <div className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Sök instruktör..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                            {filteredInstructors.map(inst => {
                                const isSelected = selectedIds.includes(inst.id)
                                return (
                                    <div
                                        key={inst.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isSelected ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                                    >
                                        <div
                                            onClick={() => toggleSelection(inst.id)}
                                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}
                                        >
                                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>

                                        <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden relative shrink-0">
                                            {inst.image_url ? (
                                                <img src={inst.image_url} alt={inst.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-300 text-slate-500 font-bold text-xs">
                                                    {inst.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-bold text-slate-900 truncate">{inst.name}</h3>
                                            <p className="text-xs text-slate-500 truncate">{inst.title || 'Instruktör'}</p>
                                        </div>

                                        {inst.is_external && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleEditClick(inst)
                                                }}
                                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                title="Redigera"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                )
                            })}
                            {filteredInstructors.length === 0 && (
                                <div className="text-center py-8 text-slate-500 text-sm">
                                    Inga instruktörer hittades
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 mt-auto">
                            <button
                                onClick={() => onSelect(selectedIds)}
                                className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
                            >
                                Klar
                            </button>
                        </div>
                    </>
                )}

                {activeTab === 'staff' && (
                    <>
                        <div className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Sök personal..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                            {filteredStaff.map(inst => {
                                const isSelected = selectedStaffIds.includes(inst.id)
                                return (
                                    <div
                                        key={inst.id}
                                        onClick={() => toggleStaffSelection(inst.id)}
                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${isSelected ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>

                                        <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden relative shrink-0">
                                            {inst.image_url ? (
                                                <img src={inst.image_url} alt={inst.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-300 text-slate-500 font-bold text-xs">
                                                    {inst.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-bold text-slate-900 truncate">{inst.name}</h3>
                                            <p className="text-xs text-slate-500 truncate">{inst.title || 'Personal'}</p>
                                        </div>
                                    </div>
                                )
                            })}
                            {filteredStaff.length === 0 && (
                                <div className="text-center py-8 text-slate-500 text-sm">
                                    Ingen personal hittades
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 mt-auto">
                            <button
                                onClick={handleSelect}
                                disabled={isPromoting || selectedStaffIds.length === 0}
                                className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                                {isPromoting ? 'Lägger till...' : 'Lägg till vald personal'}
                            </button>
                        </div>
                    </>
                )}

                {activeTab === 'external' && (
                    <form onSubmit={handleSaveExternal} className="flex-1 flex flex-col overflow-y-auto">
                        <div className="p-4 space-y-4 flex-1">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-300 transition-colors relative overflow-hidden"
                            >
                                {previewImage ? (
                                    <>
                                        <img src={previewImage} alt="Preview" className="w-24 h-24 rounded-full object-cover mb-2" />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setPreviewImage(null)
                                                if (fileInputRef.current) fileInputRef.current.value = ''
                                            }}
                                            className="text-xs text-red-500 hover:text-red-700 font-medium z-10"
                                        >
                                            Ta bort bild
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-6 h-6 text-slate-400 mb-2" />
                                        <p className="text-sm font-medium text-slate-600">Drop files here or click to upload</p>
                                        <p className="text-xs text-slate-400 mt-1">Allowed file types: .svg, .png, .jpg</p>
                                        <p className="text-xs text-slate-400">Max file size: 4 MB</p>
                                    </>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    name="image"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Instruktör namn *</label>
                                <input
                                    name="name"
                                    required
                                    type="text"
                                    defaultValue={editingInstructor?.name}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Befattning *</label>
                                <input
                                    name="title"
                                    required
                                    type="text"
                                    defaultValue={editingInstructor?.title || ''}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-post</label>
                                <input
                                    name="email"
                                    type="email"
                                    defaultValue={editingInstructor?.email || ''}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobilnummer</label>
                                <input
                                    name="phone"
                                    type="tel"
                                    defaultValue={editingInstructor?.phone || ''}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 mt-auto">
                            <button
                                type="submit"
                                disabled={isCreating}
                                className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                                {isCreating ? 'Sparar...' : (editingInstructor ? 'Uppdatera instruktör' : 'Lägg till och välj')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
