'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, XCircle, AlertTriangle } from 'lucide-react';
import { updateRegistrationStatus } from '@/app/staff/aktiviteter/actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RemoveParticipantButtonProps {
    registrationId: string;
    activityId: string;
    participantName: string;
    className?: string;
}

export default function RemoveParticipantButton({
    registrationId,
    activityId,
    participantName,
    className
}: RemoveParticipantButtonProps) {
    const [open, setOpen] = useState(false);
    const [notes, setNotes] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleRemove = () => {
        startTransition(async () => {
            try {
                // Only send notes if they are not empty
                const notesToSend = notes.trim().length > 0 ? notes.trim() : undefined;
                const result = await updateRegistrationStatus(registrationId, 'REJECTED', activityId, notesToSend);

                if (result.success) {
                    toast.success(result.message || 'Deltagare borttagen');
                    setOpen(false);
                    setNotes(''); // Reset notes
                } else {
                    toast.error(result.error || 'Ett fel uppstod');
                }
            } catch (error) {
                console.error(error);
                toast.error('Ett oväntat fel uppstod');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className={className}>
                   <XCircle className="w-3 h-3" /> Ta bort
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        Ta bort deltagare
                    </DialogTitle>
                    <DialogDescription className="pt-2">
                        Är du säker på att du vill ta bort <strong className="text-slate-900">{participantName}</strong> från aktiviteten? Denna åtgärd kan inte ångras direkt (deltagaren måste registrera sig igen).
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="notes" className="flex justify-between items-center">
                            Anledning / Kommentar
                            <span className="text-xs font-normal text-slate-500">(valfritt)</span>
                        </Label>
                        <Textarea
                            id="notes"
                            placeholder="T.ex. Deltagaren avbokade, sjukdom, eller dök inte upp..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="min-h-[100px] resize-none"
                        />
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                        Avbryt
                    </Button>
                    <Button variant="destructive" onClick={handleRemove} disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Ta bort deltagare
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
