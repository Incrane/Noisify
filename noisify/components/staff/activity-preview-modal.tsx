import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Users, X } from "lucide-react"
import Image from "next/image"
import { format } from "date-fns"
import { sv } from "date-fns/locale"

interface ActivityPreviewModalProps {
    isOpen: boolean
    onClose: () => void
    data: {
        name: string
        description: string
        imageUrl: string | null
        startDate: string
        startTime: string
        endDate: string
        endTime: string
        address: string
        capacity: number | null
        orgName: string
        activityType: 'NORMAL' | 'RANDOM'
    }
}

export default function ActivityPreviewModal({ isOpen, onClose, data }: ActivityPreviewModalProps) {
    const startDateTime = data.startDate && data.startTime ? new Date(`${data.startDate}T${data.startTime}`) : null
    const endDateTime = data.endDate && data.endTime ? new Date(`${data.endDate}T${data.endTime}`) : null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
                <DialogTitle className="sr-only">Förhandsgranskning av aktivitet</DialogTitle>
                <div className="relative h-64 bg-slate-100">
                    {data.imageUrl ? (
                        <Image
                            src={data.imageUrl}
                            alt={data.name}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-300">
                            <Calendar className="w-16 h-16" />
                        </div>
                    )}
                    <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-xs font-bold text-indigo-600 shadow-sm uppercase tracking-wider">
                            {data.activityType === 'RANDOM' ? 'Lottning' : 'Normal anmälan'}
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 left-2 bg-white/50 hover:bg-white/80 text-slate-900 rounded-full"
                        onClick={onClose}
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="p-6 md:p-8 space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">{data.name || "Namnlös aktivitet"}</h1>
                        <p className="text-lg text-slate-600">{data.orgName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <Calendar className="w-4 h-4" /> Datum
                            </div>
                            <p className="font-medium text-slate-900">
                                {startDateTime ? format(startDateTime, 'EEEE d MMMM', { locale: sv }) : '-'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <Clock className="w-4 h-4" /> Tid
                            </div>
                            <p className="font-medium text-slate-900">
                                {data.startTime} - {data.endTime}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <MapPin className="w-4 h-4" /> Plats
                            </div>
                            <p className="font-medium text-slate-900">
                                {data.address || 'Ingen plats angiven'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <Users className="w-4 h-4" /> Platser
                            </div>
                            <p className="font-medium text-slate-900">
                                {data.capacity ? `${data.capacity} platser` : 'Obegränsat'}
                            </p>
                        </div>
                    </div>

                    <div className="prose prose-slate max-w-none">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Om aktiviteten</h3>
                        <div
                            className="text-slate-600 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: data.description || "Ingen beskrivning." }}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
