'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, X, Image as ImageIcon, MoreHorizontal, ChevronDown, ChevronUp, Edit, Save, Layout, Settings, BookOpen } from 'lucide-react'
import { createCourse, updateCourse, createExternalInstructor, createTag, promoteStaffToInstructor, updateExternalInstructor } from '@/app/staff/kurser/actions'
import UnsplashModal from './unsplash-modal'
import InstructorModal from './instructor-modal'
import TagModal from './tag-modal'
import Image from 'next/image'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { MultiSelect } from '@/components/ui/multi-select'
import RichTextEditor from '@/components/ui/rich-text-editor'
import { useRef } from 'react'

interface Organization {
    id: string
    org_namn: string
}

interface Instructor {
    id: string
    name: string
    title: string | null
    image_url: string | null
    is_external?: boolean
}

interface Tag {
    id: string
    name: string
}

interface Member {
    id: string
    name: string
}

interface CourseData {
    id?: string
    name: string
    description?: string
    short_description?: string
    duration_hours?: string
    image_url?: string
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
    access_level: 'OPEN_FOR_ALL' | 'ONLY_MEMBERS' | 'SELECTED_MEMBERS'
    owner_org_id?: string
}

interface Module {
    id: string // temp id or uuid
    title: string
    description: string
    lessons: Lesson[]
}

interface Lesson {
    id: string // temp id or uuid
    title: string
    duration_minutes: number
}

export default function CourseForm({
    initialData,
    initialOrgId,
    availableInstructors = [],
    organizationStaff = [],
    availableTags = [],
    organizationMembers = [],
    initialInstructorIds = [],
    initialTagIds = [],
    initialModules = [],
    initialSelectedMemberIds = []
}: {
    initialData?: CourseData
    initialOrgId?: string
    availableInstructors?: Instructor[]
    organizationStaff?: Instructor[]
    availableTags?: Tag[]
    organizationMembers?: Member[]
    initialInstructorIds?: string[]
    initialTagIds?: string[]
    initialModules?: Module[]
    initialSelectedMemberIds?: string[]
}) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSticky, setIsSticky] = useState(false)

    // Form State
    const [name, setName] = useState(initialData?.name || '')
    const [shortDesc, setShortDesc] = useState(initialData?.short_description || '')
    const [desc, setDesc] = useState(initialData?.description || '')
    const [accessLevel, setAccessLevel] = useState(initialData?.access_level || 'OPEN_FOR_ALL')
    const [selectedImage, setSelectedImage] = useState<string | null>(initialData?.image_url || null)

    // Instructors State
    const [localInstructors, setLocalInstructors] = useState<Instructor[]>(availableInstructors)
    const [selectedInstructorIds, setSelectedInstructorIds] = useState<string[]>(initialInstructorIds)
    const [showInstructorModal, setShowInstructorModal] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImageUploadClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const url = URL.createObjectURL(file)
            setSelectedImage(url)
            // In a real app, you'd upload to storage here or keep the file for form submission
            // For now we just show the preview. The file will be in the form data if we use the input properly.
            // However, since we're using a controlled state for the image URL, we might need to handle the file upload differently 
            // or ensure the input is part of the form submission.
            // The current handleSubmit looks for 'image_url' in formData, but if it's a file, we need to handle it.
            // Let's assume the backend handles the file upload if 'image_url' is a file object, 
            // OR we need to append the file to formData manually in handleSubmit.
        }
    }

    // Tags State
    const [localTags, setLocalTags] = useState<Tag[]>(availableTags)
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds)
    const [showTagModal, setShowTagModal] = useState(false)

    // Members State (for SELECTED_MEMBERS access level)
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(initialSelectedMemberIds)

    // Modules State
    const [modules, setModules] = useState<Module[]>(initialModules)
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null) // For expanding/editing

    // Lessons State
    const [currentModuleId, setCurrentModuleId] = useState<string | null>(null)
    const [editingLesson, setEditingLesson] = useState<{ id: string, title: string, duration_minutes: number } | undefined>(undefined)

    // Unsplash State
    const [showUnsplashModal, setShowUnsplashModal] = useState(false)

    // Scroll listener for sticky header shadow
    useEffect(() => {
        const handleScroll = () => {
            setIsSticky(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // --- Handlers ---

    const handleInstructorSelect = (ids: string[], newInstructors?: Instructor[]) => {
        setSelectedInstructorIds(ids)
        if (newInstructors && newInstructors.length > 0) {
            setLocalInstructors(prev => {
                const updated = [...prev]
                newInstructors.forEach(newInst => {
                    const index = updated.findIndex(p => p.id === newInst.id)
                    if (index >= 0) {
                        updated[index] = newInst
                    } else {
                        updated.push(newInst)
                    }
                })
                return updated
            })
        }
        setShowInstructorModal(false)
    }

    const handleTagCreate = async (tagName: string) => {
        const newTag = await createTag(tagName)
        if (newTag) {
            setLocalTags(prev => [...prev, newTag])
            setSelectedTagIds([...selectedTagIds, newTag.id])
        }
        setShowTagModal(false)
    }

    // Modules handlers
    const addModule = () => {
        const newId = Math.random().toString(36).substr(2, 9)
        setModules([...modules, { id: newId, title: '', description: '', lessons: [] }])
        setActiveModuleId(newId)
    }

    const updateModule = (id: string, field: keyof Module, value: string) => {
        setModules(modules.map(m => m.id === id ? { ...m, [field]: value } : m))
    }

    const removeModule = (id: string) => {
        setModules(modules.filter(m => m.id !== id))
    }

    // Lesson handlers
    const handleEditLesson = (moduleId: string, lesson: Lesson) => {
        setCurrentModuleId(moduleId)
        setEditingLesson(lesson)
    }

    const handleSaveLesson = (lessonData: { title: string, duration_minutes: number, start_at?: string, end_at?: string }) => {
        if (!currentModuleId) return

        setModules(modules.map(mod => {
            if (mod.id !== currentModuleId) return mod

            if (editingLesson) {
                // Edit existing
                return {
                    ...mod,
                    lessons: mod.lessons.map(l => l.id === editingLesson.id ? { ...l, ...lessonData } : l)
                }
            } else {
                // Add new
                return {
                    ...mod,
                    lessons: [...mod.lessons, { id: Math.random().toString(36).substr(2, 9), ...lessonData }]
                }
            }
        }))
    }

    const handleRemoveLesson = (moduleId: string, lessonId: string) => {
        setModules(modules.map(mod => {
            if (mod.id !== moduleId) return mod
            return {
                ...mod,
                lessons: mod.lessons.filter(l => l.id !== lessonId)
            }
        }))
    }

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes} minuter`
        const h = Math.floor(minutes / 60)
        const m = minutes % 60
        if (m === 0) return `${h} timma${h > 1 ? 'r' : ''}`
        return `${h} timma${h > 1 ? 'r' : ''} och ${m} minut${m !== 1 ? 'er' : ''}`
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsSubmitting(true)
        setError(null)

        const formData = new FormData(event.currentTarget)

        if (selectedImage && selectedImage.startsWith('blob:')) {
            // If it's a blob URL, it means a file was selected via input. 
            // The file input 'image_file' is already in formData because it has a name attribute.
            // We don't need to do anything extra if the server action handles 'image_file'.
        } else if (selectedImage) {
            formData.append('image_url', selectedImage)
        }
        formData.append('access_level', accessLevel)

        // Ensure basic fields are present even if inputs are unmounted (e.g. when on different tabs)
        formData.set('name', name)
        formData.set('short_description', shortDesc)
        formData.set('description', desc)

        // Append JSON data
        formData.append('instructors', JSON.stringify(selectedInstructorIds))
        formData.append('tags', JSON.stringify(selectedTagIds))
        formData.append('modules', JSON.stringify(modules))

        const action = (event.nativeEvent as any).submitter.name // 'draft' or 'publish'
        const status = action === 'publish' ? 'PUBLISHED' : 'DRAFT'
        formData.append('status', status)

        try {
            if (initialData?.id) {
                await updateCourse(initialData.id, formData)
                router.refresh()
            } else {
                const newId = await createCourse(formData)
                router.push(`/staff/kurser/${newId}`)
            }
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Ett oväntat fel inträffade'
            setError(message)
            setIsSubmitting(false)
        }
    }

    const selectedInstructors = localInstructors.filter(i => selectedInstructorIds.includes(i.id))
    const selectedTags = localTags.filter(t => selectedTagIds.includes(t.id))
    const selectedMembers = organizationMembers.filter(m => selectedMemberIds.includes(m.id))

    return (
        <>
            <form onSubmit={handleSubmit} className="max-w-5xl mx-auto pb-24 relative">

                {/* Sticky Header */}
                <div className={`sticky top-0 z-10 bg-white/80 backdrop-blur-md py-4 mb-6 transition-all border-b ${isSticky ? 'border-slate-200 shadow-sm' : 'border-transparent'}`}>
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900 hidden sm:block">
                            {initialData ? 'Redigera Kurs' : 'Skapa Ny Kurs'}
                        </h2>
                        <div className="flex gap-3 ml-auto">
                            <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors text-sm">
                                Avbryt
                            </button>
                            <button
                                type="submit"
                                name="action"
                                value="draft"
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-white border border-orange-200 text-orange-700 rounded-lg font-bold text-sm hover:bg-orange-50 transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Spara utkast
                            </button>
                            <button
                                type="submit"
                                name="action"
                                value="publish"
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm shadow-indigo-200 flex items-center gap-2"
                            >
                                Publicera
                            </button>
                        </div>
                    </div>
                </div>

                {error && <div className="mb-6 text-red-600 bg-red-50 p-4 rounded-lg text-sm border border-red-100">{error}</div>}

                <Tabs defaultValue="overview">
                    <TabsList className="mb-8 w-full sm:w-auto">
                        <TabsTrigger value="overview">
                            <Layout className="w-4 h-4 mr-2" />
                            Översikt
                        </TabsTrigger>
                        <TabsTrigger value="curriculum">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Kursplan
                        </TabsTrigger>
                        <TabsTrigger value="settings">
                            <Settings className="w-4 h-4 mr-2" />
                            Inställningar
                        </TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="space-y-8">
                        {/* Image Upload Section */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">Omslagsbild</label>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                                name="image_file" // Changed name to distinguish from image_url string
                            />
                            <div className={`relative h-64 rounded-xl border-2 border-dashed transition-all overflow-hidden group
                        ${selectedImage ? 'border-slate-200' : 'bg-indigo-50/50 border-indigo-100 hover:border-indigo-300'}`}>

                                {selectedImage ? (
                                    <>
                                        <Image src={selectedImage} alt="Course cover" fill className="object-cover" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => setShowUnsplashModal(true)}
                                                className="px-3 py-1.5 bg-white/90 text-slate-700 text-xs font-medium rounded-lg hover:bg-white shadow-sm"
                                            >
                                                Ändra
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedImage(null)}
                                                className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-sm"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <p className="text-slate-400 mb-4 text-sm">Inga bilder valda</p>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={handleImageUploadClick}
                                                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm"
                                            >
                                                Ladda upp bild
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowUnsplashModal(true)}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200"
                                            >
                                                Välj från Unsplash
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Basic Fields */}
                        <div className="space-y-6 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Kursnamn *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                                    placeholder="T.ex. Introduktion till Musikproduktion"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Kort beskrivning</label>
                                <input
                                    type="text"
                                    name="short_description"
                                    value={shortDesc}
                                    onChange={e => setShortDesc(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                                    placeholder="En kort sammanfattning som visas i listor..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fullständig beskrivning</label>
                                <RichTextEditor
                                    value={desc}
                                    onChange={setDesc}
                                    placeholder="Beskriv kursens innehåll, mål och upplägg i detalj..."
                                />
                                <input type="hidden" name="description" value={desc} />
                            </div>
                        </div>
                    </TabsContent>

                    {/* CURRICULUM TAB */}
                    <TabsContent value="curriculum" className="space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Kursinnehåll</h3>
                                <p className="text-slate-500 text-sm">Bygg upp din kurs med moduler och lektioner.</p>
                            </div>
                            <button
                                type="button"
                                onClick={addModule}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
                            >
                                <Plus className="w-4 h-4" /> Ny modul
                            </button>
                        </div>

                        <div className="space-y-4">
                            {modules.length === 0 && (
                                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">Inga moduler än</p>
                                    <p className="text-slate-400 text-sm mb-4">Börja med att skapa din första modul.</p>
                                    <button
                                        type="button"
                                        onClick={addModule}
                                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm"
                                    >
                                        Skapa modul
                                    </button>
                                </div>
                            )}

                            {modules.map((module, moduleIndex) => (
                                <div key={module.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                    <div
                                        className="p-4 flex items-center justify-between cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors"
                                        onClick={() => setActiveModuleId(activeModuleId === module.id ? null : module.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                M{moduleIndex + 1}
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-800 text-sm block">{module.title || 'Namnlös modul'}</span>
                                                <span className="text-xs text-slate-500">{module.lessons.length} lektioner</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={(e) => { e.stopPropagation(); removeModule(module.id) }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            {activeModuleId === module.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                        </div>
                                    </div>

                                    {activeModuleId === module.id && (
                                        <div className="p-6 space-y-6 border-t border-slate-100 bg-white">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Modul titel</label>
                                                    <input
                                                        type="text"
                                                        value={module.title}
                                                        onChange={e => updateModule(module.id, 'title', e.target.value)}
                                                        className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        placeholder="T.ex. Introduktion"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Beskrivning</label>
                                                    <RichTextEditor
                                                        value={module.description}
                                                        onChange={(val) => updateModule(module.id, 'description', val)}
                                                        placeholder="Kort beskrivning av modulen"
                                                        className="min-h-[100px]"
                                                    />
                                                </div>
                                            </div>

                                            {/* Lessons list */}
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <label className="block text-xs font-bold text-slate-500 uppercase">Lektioner</label>
                                                </div>

                                                <div className="space-y-2 mb-3">
                                                    {module.lessons.map((lesson, index) => (
                                                        <div key={lesson.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${editingLesson?.id === lesson.id ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'}`}>
                                                            {editingLesson?.id === lesson.id ? (
                                                                <div className="flex-1 flex items-center gap-3">
                                                                    <div className="flex-1 grid grid-cols-3 gap-3">
                                                                        <div className="col-span-2">
                                                                            <input
                                                                                type="text"
                                                                                value={editingLesson.title}
                                                                                onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                                                                                className="w-full px-3 py-1.5 rounded-md border border-indigo-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                                                placeholder="Lektionens titel"
                                                                                autoFocus
                                                                            />
                                                                        </div>
                                                                        <div className="relative">
                                                                            <input
                                                                                type="number"
                                                                                value={editingLesson.duration_minutes}
                                                                                onChange={(e) => {
                                                                                    const val = parseInt(e.target.value) || 0
                                                                                    setEditingLesson({ ...editingLesson, duration_minutes: Math.max(0, val) })
                                                                                }}
                                                                                className="w-full px-3 py-1.5 rounded-md border border-indigo-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm pr-12"
                                                                                placeholder="Min"
                                                                                min="0"
                                                                            />
                                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">min</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                handleSaveLesson(editingLesson);
                                                                                setEditingLesson(undefined);
                                                                            }}
                                                                            className="p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm"
                                                                            title="Spara"
                                                                        >
                                                                            <Save className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                // If it was a new unsaved lesson (empty title), remove it
                                                                                if (lesson.title === '' && lesson.duration_minutes === 0) {
                                                                                    handleRemoveLesson(module.id, lesson.id);
                                                                                }
                                                                                setEditingLesson(undefined);
                                                                            }}
                                                                            className="p-1.5 bg-white text-slate-500 border border-slate-200 rounded-md hover:bg-slate-50 shadow-sm"
                                                                            title="Avbryt"
                                                                        >
                                                                            <X className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-medium text-slate-500">
                                                                            {index + 1}
                                                                        </div>
                                                                        <div>
                                                                            <span className="font-bold text-slate-900 text-sm block">{lesson.title}</span>
                                                                            <span className="text-xs text-slate-500">{formatDuration(lesson.duration_minutes)}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <div className="flex flex-col mr-2">
                                                                            <button
                                                                                type="button"
                                                                                disabled={index === 0}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    const newLessons = [...module.lessons];
                                                                                    [newLessons[index - 1], newLessons[index]] = [newLessons[index], newLessons[index - 1]];
                                                                                    updateModule(module.id, 'lessons', newLessons as any);
                                                                                }}
                                                                                className="text-slate-300 hover:text-slate-600 disabled:opacity-30 disabled:hover:text-slate-300"
                                                                            >
                                                                                <ChevronUp className="w-3 h-3" />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                disabled={index === module.lessons.length - 1}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    const newLessons = [...module.lessons];
                                                                                    [newLessons[index + 1], newLessons[index]] = [newLessons[index], newLessons[index + 1]];
                                                                                    updateModule(module.id, 'lessons', newLessons as any);
                                                                                }}
                                                                                className="text-slate-300 hover:text-slate-600 disabled:opacity-30 disabled:hover:text-slate-300"
                                                                            >
                                                                                <ChevronDown className="w-3 h-3" />
                                                                            </button>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setCurrentModuleId(module.id);
                                                                                setEditingLesson(lesson);
                                                                            }}
                                                                            className="p-1.5 text-slate-400 hover:bg-white hover:text-indigo-600 rounded-md shadow-sm transition-colors"
                                                                        >
                                                                            <Edit className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveLesson(module.id, lesson.id)}
                                                                            className="p-1.5 text-slate-400 hover:bg-white hover:text-red-500 rounded-md shadow-sm transition-colors"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newLesson = { id: Math.random().toString(36).substr(2, 9), title: '', duration_minutes: 0 };
                                                        // Add empty lesson and immediately start editing it
                                                        setModules(modules.map(m => {
                                                            if (m.id !== module.id) return m;
                                                            return { ...m, lessons: [...m.lessons, newLesson] };
                                                        }));
                                                        setCurrentModuleId(module.id);
                                                        setEditingLesson(newLesson);
                                                    }}
                                                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-lg text-slate-500 text-sm font-medium hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Plus className="w-4 h-4" /> Lägg till lektion
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* SETTINGS TAB */}
                    <TabsContent value="settings" className="space-y-8">
                        {/* Instructors */}
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Instruktörer</h3>
                            <div className="flex flex-wrap gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowInstructorModal(true)}
                                    className="w-32 h-32 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center hover:border-indigo-300 hover:bg-slate-50 transition-all group"
                                >
                                    <Plus className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" />
                                </button>

                                {selectedInstructors.map(inst => (
                                    <div key={inst.id} className="relative w-48 p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col items-center text-center group">
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedInstructorIds(prev => prev.filter(id => id !== inst.id))}
                                                className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="w-16 h-16 bg-slate-100 rounded-full mb-3 relative overflow-hidden">
                                            {inst.image_url ? (
                                                <Image src={inst.image_url} alt={inst.name} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xl">
                                                    {inst.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-sm">{inst.name}</h3>
                                        <p className="text-xs text-indigo-500 font-medium mt-0.5">{inst.title || 'Instruktör'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Taggar</h3>
                            <MultiSelect
                                options={localTags.map(t => ({ id: t.id, name: t.name }))}
                                selected={selectedTagIds}
                                onChange={setSelectedTagIds}
                                placeholder="Välj taggar..."
                                searchPlaceholder="Sök taggar..."
                                onCreateNew={() => setShowTagModal(true)}
                                createNewLabel="Skapa ny tagg"
                            />
                        </div>

                        {/* Registration Rules */}
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Behörighet</h3>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                                    <input
                                        type="radio"
                                        name="access_level_radio"
                                        value="OPEN_FOR_ALL"
                                        checked={accessLevel === 'OPEN_FOR_ALL'}
                                        onChange={() => setAccessLevel('OPEN_FOR_ALL')}
                                        className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <span className="text-slate-900 font-medium text-sm block">Öppen för alla</span>
                                        <span className="text-slate-500 text-xs">Alla användare kan se och anmäla sig till kursen.</span>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                                    <input
                                        type="radio"
                                        name="access_level_radio"
                                        value="ONLY_MEMBERS"
                                        checked={accessLevel === 'ONLY_MEMBERS'}
                                        onChange={() => setAccessLevel('ONLY_MEMBERS')}
                                        className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <span className="text-slate-900 font-medium text-sm block">Endast Medlemmar</span>
                                        <span className="text-slate-500 text-xs">Endast registrerade medlemmar i din organisation kan se kursen.</span>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                                    <input
                                        type="radio"
                                        name="access_level_radio"
                                        value="SELECTED_MEMBERS"
                                        checked={accessLevel === 'SELECTED_MEMBERS'}
                                        onChange={() => setAccessLevel('SELECTED_MEMBERS')}
                                        className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <span className="text-slate-900 font-medium text-sm block">Välj medlemmar</span>
                                        <span className="text-slate-500 text-xs">Du bjuder in specifika medlemmar manuellt.</span>
                                    </div>
                                </label>
                            </div>

                            {/* Member Selection - Only shown when SELECTED_MEMBERS is selected */}
                            {accessLevel === 'SELECTED_MEMBERS' && (
                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Välj medlemmar</label>
                                    <MultiSelect
                                        options={organizationMembers.map(m => ({ id: m.id, name: m.name }))}
                                        selected={selectedMemberIds}
                                        onChange={setSelectedMemberIds}
                                        placeholder="Välj medlemmar som kan delta..."
                                        searchPlaceholder="Sök medlemmar..."
                                    />
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                <input type="hidden" name="org_id" value={initialOrgId} />
            </form>

            <UnsplashModal
                isOpen={showUnsplashModal}
                onClose={() => setShowUnsplashModal(false)}
                onSelect={(url) => setSelectedImage(url)}
                orgId={initialOrgId || ''}
            />

            <InstructorModal
                isOpen={showInstructorModal}
                onClose={() => setShowInstructorModal(false)}
                onSelect={handleInstructorSelect}
                availableInstructors={localInstructors}
                organizationStaff={organizationStaff}
                preSelectedIds={selectedInstructorIds}
                orgId={initialOrgId || ''}
                onCreateExternal={createExternalInstructor}
                onUpdateExternal={updateExternalInstructor}
                onPromoteStaff={promoteStaffToInstructor}
            />

            <TagModal
                isOpen={showTagModal}
                onClose={() => setShowTagModal(false)}
                onCreate={handleTagCreate}
            />
        </>
    )
}
