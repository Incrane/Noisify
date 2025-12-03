'use client'

import { useState } from 'react'
import { Dices, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { runLottery } from '@/app/staff/aktiviteter/actions'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function RunLotteryButton({ activityId }: { activityId: string }) {
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    const handleRunLottery = async () => {
        setLoading(true)
        try {
            const result = await runLottery(activityId)
            if (result.success) {
                toast.success(result.message)
                setOpen(false)
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error('Ett fel uppstod vid lottningen')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                    <Dices className="w-4 h-4" />
                    Kör lottning
                </button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Dices className="w-5 h-5 text-purple-600" />
                        Kör lottning
                    </DialogTitle>
                    <DialogDescription className="pt-2">
                        Är du säker på att du vill köra lottningen?
                    </DialogDescription>
                    <div className="text-sm text-muted-foreground">
                        <br />
                        Detta kommer att:
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Slumpmässigt fördela platserna bland de väntande.</li>
                            <li>Godkänna deltagare upp till maxantalet.</li>
                            <li>Placera övriga på väntelistan.</li>
                        </ul>
                    </div>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <DialogClose asChild>
                        <Button variant="outline">Avbryt</Button>
                    </DialogClose>
                    <Button
                        onClick={handleRunLottery}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        {loading ? 'Kör lottning...' : 'Ja, kör lottning'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
