'use client';

import { usePathname } from 'next/navigation';
import SearchInput from '@/components/search-input';
import { Suspense } from 'react';

interface MobileGreetingProps {
    alias: string;
}

export default function MobileGreeting({ alias }: MobileGreetingProps) {
    const pathname = usePathname();

    // Hide on chat page
    if (pathname === '/app/chatt') {
        return null;
    }

    return (
        <div className="md:hidden px-4 pt-4 pb-2 space-y-4 bg-slate-50">
            <div>
                <h1 className="text-xl font-bold text-slate-900">
                    Hej {alias || 'Användare'}!
                </h1>
                <p className="text-sm text-slate-500">
                    Välkommen tillbaka
                </p>
            </div>
            <Suspense fallback={<div className="h-12 bg-slate-100 rounded-full" />}>
                <SearchInput placeholder="Sök aktiviteter..." />
            </Suspense>
        </div>
    );
}
