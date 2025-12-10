'use client';

import { useState } from 'react';
import { updateStaffProfile } from '@/app/staff/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from 'lucide-react';

interface StaffProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail: string;
    initialAlias?: string;
}

export default function StaffProfileModal({
    isOpen,
    onClose,
    userEmail,
    initialAlias = ''
}: StaffProfileModalProps) {
    const [alias, setAlias] = useState(initialAlias);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('alias', alias);
            await updateStaffProfile(formData);
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Ett fel uppstod när profilen skulle uppdateras.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Profilinställningar</DialogTitle>
                    <DialogDescription>
                        Uppdatera din profilinformation här.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">E-post</Label>
                        <Input
                            id="email"
                            value={userEmail}
                            disabled
                            className="bg-slate-50 text-slate-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="alias">Alias</Label>
                        <Input
                            id="alias"
                            value={alias}
                            onChange={(e) => setAlias(e.target.value)}
                            placeholder="Ditt alias"
                            required
                            minLength={2}
                        />
                        <p className="text-xs text-slate-500">
                            Detta namn visas för andra användare i systemet.
                        </p>
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
                            {error}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                            Avbryt
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Spara ändringar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
