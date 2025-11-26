'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { updateRegistrationStatus } from '@/app/staff/aktiviteter/actions';

interface RegistrationStatusButtonProps {
    registrationId: string;
    activityId: string;
    status: string;
    children: React.ReactNode;
    className?: string;
}

export default function RegistrationStatusButton({
    registrationId,
    activityId,
    status,
    children,
    className
}: RegistrationStatusButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleClick = () => {
        startTransition(async () => {
            try {
                const result = await updateRegistrationStatus(registrationId, status, activityId);

                if (result.success) {
                    toast.success(result.message || 'Status uppdaterad');
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
        <button
            onClick={handleClick}
            disabled={isPending}
            className={className}
        >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : children}
        </button>
    );
}
