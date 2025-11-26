'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Zap, Info, Clock, MapPin, Users, Link as LinkIcon, Trash2 } from 'lucide-react'
import { createActivity, updateActivity } from '@/app/staff/aktiviteter/actions'
import UnsplashModal from './unsplash-modal'
import Image from 'next/image'

// Types
interface Organization {
  id: string
  org_namn: string
}
interface Category {
  id: string
  category_name: string
}
interface TargetSubgroup {
  id: string
  subgroup_name: string
}
interface StaffProfile {
  profile_id: string
  alias: string | null
  public_name: string | null
}

// Define a proper type for initialData to avoid 'any'
interface ActivityInitialData {
  activity_id: string;
  aktivitet: string;
  beskrivning: string | null;
  image_url: string | null;
  start_datum_tid: string;
  slut_datum_tid: string;
  start_tid: string;
  slut_tid: string;
  total_kapacitet: number | null;
  reservplatser: number | null;
  anmalningsfrist: string | null;
  plats: string | null;
  registreringsregler: string;
  min_age: number | null;
  max_age: number | null;
  category_id?: string;
  kategorier?: string;
  agande_org_id: string;
  created_by: string;
  [key: string]: unknown; // Allow other fields
}

export default function ActivityForm({
  organizations,
  categories,
  targetSubgroups,
  staffMembers,
  initialOrgId,
  initialData
}: {
  organizations: Organization[]
  categories: Category[]
  targetSubgroups: TargetSubgroup[]
  staffMembers: StaffProfile[]
  initialOrgId?: string
  initialData?: ActivityInitialData
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Unsplash State
  const [showUnsplashModal, setShowUnsplashModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(initialData?.image_url || null)

  // PowerUps State
  const [showWaitlist, setShowWaitlist] = useState(!!initialData?.reservplatser)
  const [showRegistrationSlips, setShowRegistrationSlips] = useState(false)
  const [showRecurring, setShowRecurring] = useState(false)
  const [showCollaboration, setShowCollaboration] = useState(false)
  const [showDeadline, setShowDeadline] = useState(!!initialData?.anmalningsfrist)
  const [showAgeLimit, setShowAgeLimit] = useState(!!(initialData?.min_age || initialData?.max_age))

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    if (selectedImage) {
        formData.append('image_url', selectedImage)
    }
    
    try {
      if (initialData) {
        await updateActivity(formData)
      } else {
        await createActivity(formData)
      }
      router.push('/staff/aktiviteter')
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Ett oväntat fel uppstod';
      setError(errorMessage)
      setIsSubmitting(false)
    }
  }

  // Dates parsing
  // The view provides start_datum_tid as ISO string usually.
  // Let's safer parse from ISO.
  const getISODate = (iso: string) => iso ? iso.split('T')[0] : '';
  const getISOTime = (iso: string) => iso ? iso.split('T')[1].substring(0, 5) : '';
  
  const startDate = initialData ? getISODate(initialData.start_datum_tid) : '';
  const startTime = initialData ? getISOTime(initialData.start_datum_tid) : '';
  const endDate = initialData ? getISODate(initialData.slut_datum_tid) : '';
  const endTime = initialData ? getISOTime(initialData.slut_datum_tid) : '';

  return (
    <>
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {initialData && <input type="hidden" name="activity_id" value={initialData.activity_id} />}
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
            {/* Image Upload */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-slate-700">Ladda upp bild</label>
                    <button 
                        type="button" 
                        onClick={() => setShowUnsplashModal(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 transition-colors"
                    >
                        Unsplash
                    </button>
                </div>
                
                {selectedImage ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden group">
                        <Image src={selectedImage} alt="Selected activity image" fill className="object-cover" />
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                type="button"
                                onClick={() => setSelectedImage(null)}
                                className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-sm"
                                title="Radera bild"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:border-indigo-300 transition-colors cursor-pointer bg-slate-50/50">
                        <Upload className="w-8 h-8 text-slate-400 mb-3" />
                        <p className="text-sm text-slate-600 font-medium">Drop files here or click to upload</p>
                        <p className="text-xs text-slate-400 mt-1">Allowed file types: .svg, .png, .jpg</p>
                        <p className="text-xs text-slate-400">Max file size: 4 MB</p>
                        <input type="file" name="image" className="hidden" />
                    </div>
                )}
            </div>


            {/* Basic Info */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Aktivitetstitel *</label>
                    <input type="text" name="name" required defaultValue={initialData?.aktivitet} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Beskrivning</label>
                    <div className="border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all">
                        <div className="flex items-center gap-1 p-2 border-b border-slate-200 bg-slate-50 overflow-x-auto">
                            <button type="button" className="p-1.5 text-slate-500 hover:bg-slate-200 rounded"><span className="font-serif font-bold">P</span></button>
                            <button type="button" className="p-1.5 text-slate-500 hover:bg-slate-200 rounded"><span className="font-bold">B</span></button>
                            <button type="button" className="p-1.5 text-slate-500 hover:bg-slate-200 rounded"><span className="italic">I</span></button>
                            <div className="w-px h-4 bg-slate-300 mx-1"></div>
                            <button type="button" className="p-1.5 text-slate-500 hover:bg-slate-200 rounded"><LinkIcon className="w-4 h-4" /></button>
                        </div>
                        <textarea name="description" rows={6} defaultValue={initialData?.beskrivning || ''} className="w-full p-4 border-none focus:ring-0 resize-y" placeholder="Skriv din beskrivning här..."></textarea>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Börjar *</label>
                        <div className="flex gap-2">
                            <input type="date" name="date_start" required defaultValue={startDate} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                            <input type="time" name="time_start" required defaultValue={startTime} className="w-24 rounded-lg border border-slate-300 px-3 py-2" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Slutar *</label>
                        <div className="flex gap-2">
                            <input type="date" name="date_end" required defaultValue={endDate} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                            <input type="time" name="time_end" required defaultValue={endTime} className="w-24 rounded-lg border border-slate-300 px-3 py-2" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Antal platser *</label>
                        <input type="number" name="capacity" min="1" defaultValue={initialData?.total_kapacitet || 1} required className="w-full rounded-lg border border-slate-300 px-4 py-2.5" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Kontaktpersoner *</label>
                        <select name="contact_person" defaultValue={initialData?.created_by} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 bg-white">
                            <option value="">Välj personal...</option>
                            {staffMembers.map(s => (
                                <option key={s.profile_id} value={s.profile_id}>{s.alias || s.public_name || 'Namnlös'}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Målgrupp *</label>
                         <select name="target_group_main" defaultValue="Alla åldrar" className="w-full rounded-lg border border-slate-300 px-4 py-2.5 bg-white">
                             <option value="Alla åldrar">Alla åldrar</option>
                             <option value="Ungdomar">Ungdomar</option>
                         </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Kategorier *</label>
                        <select name="category_id" defaultValue={initialData?.category_id} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 bg-white">
                            <option value="">Välj kategori...</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.category_name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Adress *</label>
                    <div className="relative">
                         <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                         <input type="text" name="address" required defaultValue={initialData?.plats || ''} className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2.5" />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                         {['Angered Fritidsgård', 'Bergsjön Fritidsgård', 'Kortedala Fritidsgård'].map(addr => (
                             <button type="button" key={addr} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-full hover:bg-slate-200 transition-colors">
                                 {addr}
                             </button>
                         ))}
                    </div>
                </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
                <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors">
                    Tillbaka
                </button>
                <div className="flex gap-3">
                    <button type="submit" name="action" value="draft" disabled={isSubmitting} className="px-6 py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50">
                        {initialData ? 'Spara utkast' : 'Spara som utkast'}
                    </button>
                    <button type="submit" name="action" value="publish" disabled={isSubmitting} className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50">
                        {isSubmitting ? 'Sparar...' : (initialData ? 'Uppdatera aktivitet' : 'Publicera aktivitet')}
                    </button>
                </div>
            </div>
            {error && <div className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>}
        </div>

        {/* Sidebar PowerUps */}
        <div className="space-y-6">
            <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100">
                <div className="flex items-center gap-2 mb-6">
                    <div className="bg-indigo-600 p-1.5 rounded-lg">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">Power Ups</h2>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Anmälningsregler</label>
                        <select name="registration_rules" defaultValue={initialData?.registreringsregler || "OPEN_FOR_ALL"} className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-sm">
                            <option value="OPEN_FOR_ALL">Öppen för alla</option>
                            <option value="MEMBERS_ONLY">Endast medlemmar</option>
                            <option value="INVITE_ONLY">Endast inbjudna</option>
                        </select>
                    </div>

                    <PowerUpToggle label="Reservplatser" isOn={showWaitlist} onToggle={setShowWaitlist} icon={<Users className="w-4 h-4" />} />
                    {showWaitlist && (
                        <div className="pl-6 mt-2">
                            <input type="number" name="reserve_capacity" defaultValue={initialData?.reservplatser || 0} placeholder="0" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                        </div>
                    )}

                    <PowerUpToggle label="Anmälningslappar" isOn={showRegistrationSlips} onToggle={setShowRegistrationSlips} icon={<Info className="w-4 h-4" />} />
                    {showRegistrationSlips && (
                        <div className="pl-6 mt-2 p-4 border border-dashed border-slate-300 rounded-lg text-center bg-white">
                             <span className="text-xs text-slate-500">Upload PDF</span>
                        </div>
                    )}

                    <PowerUpToggle label="Återkommande" isOn={showRecurring} onToggle={setShowRecurring} icon={<Clock className="w-4 h-4" />} />
                    {showRecurring && (
                        <div className="pl-6 mt-2">
                             <input type="text" name="rrule" placeholder="RRULE string or description" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                        </div>
                    )}

                    <PowerUpToggle label="Samarbete" isOn={showCollaboration} onToggle={setShowCollaboration} icon={<Users className="w-4 h-4" />} />
                    {showCollaboration && (
                        <div className="pl-6 mt-2">
                             <select name="collaboration_org" className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-sm">
                                 <option value="">Välj verksamhet...</option>
                                 {organizations.filter(o => o.id !== initialOrgId).map(o => (
                                     <option key={o.id} value={o.id}>{o.org_namn}</option>
                                 ))}
                             </select>
                        </div>
                    )}

                    <PowerUpToggle label="Sista anmälningsdatum" isOn={showDeadline} onToggle={setShowDeadline} icon={<Clock className="w-4 h-4" />} />
                    {showDeadline && (
                        <div className="pl-6 mt-2">
                             <input type="datetime-local" name="registration_deadline" defaultValue={initialData?.anmalningsfrist ? new Date(initialData.anmalningsfrist).toISOString().slice(0,16) : ''} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                        </div>
                    )}

                    <div className="border-t border-indigo-100 my-4 pt-4">
                        <h3 className="text-sm font-bold text-slate-900 mb-3">Restriktioner</h3>
                        <div className="mb-4">
                            <label className="block text-xs text-slate-500 mb-2">Välj vilka kön som kan delta:</label>
                            <div className="flex flex-wrap gap-2">
                                {targetSubgroups.map(ts => (
                                    <label key={ts.id} className="inline-flex items-center px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-200">
                                        <input type="checkbox" name="target_subgroups" value={ts.id} className="mr-2" />
                                        {ts.subgroup_name}
                                    </label>
                                ))}
                            </div>
                        </div>
                        
                        <PowerUpToggle label="Åldersgräns" isOn={showAgeLimit} onToggle={setShowAgeLimit} icon={<Users className="w-4 h-4" />} />
                        {showAgeLimit && (
                            <div className="pl-0 mt-2 flex items-center gap-2">
                                 <div className="flex-1">
                                     <span className="text-xs text-slate-500 block mb-1">Från:</span>
                                     <input type="number" name="age_min" defaultValue={initialData?.min_age || ''} className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm" placeholder="0" />
                                 </div>
                                 <div className="flex-1">
                                     <span className="text-xs text-slate-500 block mb-1">Till:</span>
                                     <input type="number" name="age_max" defaultValue={initialData?.max_age || ''} className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm" placeholder="100" />
                                 </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        
        <input type="hidden" name="org_id" value={initialOrgId} />
    </form>

    <UnsplashModal 
        isOpen={showUnsplashModal} 
        onClose={() => setShowUnsplashModal(false)} 
        onSelect={(url) => setSelectedImage(url)}
        orgId={initialOrgId || ''}
    />
    </>
  )
}

function PowerUpToggle({ label, isOn, onToggle, icon }: { label: string, isOn: boolean, onToggle: (v: boolean) => void, icon: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-700">
                {icon}
                <span>{label}</span>
            </div>
            <button 
                type="button"
                onClick={() => onToggle(!isOn)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isOn ? 'bg-indigo-600' : 'bg-slate-200'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${isOn ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    )
}
