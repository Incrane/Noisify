'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from 'lucide-react';
import { updateAliasAfterForce } from '@/app/app/profil/actions';

interface ForceAliasChangeModalProps {
    isOpen: boolean;
    currentAlias: string;
    profileId: string;
}

export default function ForceAliasChangeModal({
    isOpen,
    currentAlias,
    profileId
}: ForceAliasChangeModalProps) {
    const router = useRouter();
    const [newAlias, setNewAlias] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!newAlias.trim()) {
            setError('Ange ett nytt alias');
            return;
        }

        if (newAlias.trim().length < 3) {
            setError('Alias måste vara minst 3 tecken');
            return;
        }

        if (newAlias.toLowerCase() === currentAlias.toLowerCase()) {
            setError('Du måste välja ett annat alias än ditt nuvarande');
            return;
        }

        setLoading(true);

        try {
            const result = await updateAliasAfterForce(profileId, newAlias.trim());

            if (result.error) {
                setError(result.error);
            } else {
                toast.success('Ditt alias har uppdaterats!');
                router.refresh();
            }
        } catch (err) {
            console.error('Error updating alias:', err);
            setError('Ett fel uppstod vid uppdatering av alias');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent
                className="sm:max-w-[425px]"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                        <DialogTitle className="text-xl">Byt ditt alias</DialogTitle>
                    </div>
                    <DialogDescription className="text-left">
                        En administratör har begärt att du väljer ett nytt alias. Ditt tidigare alias
                        <span className="font-semibold text-slate-700"> "{currentAlias}" </span>
                        är inte längre tillgängligt och kan inte användas igen.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-alias">Nytt alias</Label>
                        <Input
                            id="new-alias"
                            placeholder="Ange ditt nya alias"
                            value={newAlias}
                            onChange={(e) => setNewAlias(e.target.value)}
                            className="bg-slate-50"
                            autoFocus
                            disabled={loading}
                        />
                        <p className="text-xs text-slate-500">
                            Välj ett alias som är unikt och inte innehåller personlig information.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                        disabled={loading}
                    >
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Spara nytt alias
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
