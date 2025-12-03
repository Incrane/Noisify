'use client'

import { useState } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { respondToInvitation } from '@/app/app/aktiviteter/actions'

interface InvitationActionsProps {
    registrationId: string
}

export default function InvitationActions({ registrationId }: InvitationActionsProps) {
    const [loading, setLoading] = useState<'accept' | 'reject' | null>(null)

    const handleResponse = async (accept: boolean) => {
        setLoading(accept ? 'accept' : 'reject')
        try {
            const result = await respondToInvitation(registrationId, accept)
            if (result.success) {
                toast.success(accept ? 'Du har tackat ja!' : 'Du har avböjt inbjudan.')
            } else {
                toast.error(result.error || 'Ett fel uppstod')
            }
        } catch (error) {
            toast.error('Ett fel uppstod')
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="flex gap-2">
            <button
                onClick={() => handleResponse(true)}
                disabled={loading !== null}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
                {loading === 'accept' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Tacka ja
            </button>
            <button
                onClick={() => handleResponse(false)}
                disabled={loading !== null}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
                {loading === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Avböj
            </button>
        </div>
    )
}
