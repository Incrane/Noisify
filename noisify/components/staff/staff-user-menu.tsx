'use client';

import { useState, useTransition } from 'react';
import { signOut } from '@/app/login/actions';
import StaffProfileModal from './staff-profile-modal';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, LogOut, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StaffUserMenuProps {
    userEmail: string;
    alias?: string;
    isCollapsed?: boolean;
}

export default function StaffUserMenu({
    userEmail,
    alias,
    isCollapsed = false
}: StaffUserMenuProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleLogout = () => {
        startTransition(async () => {
            await signOut();
        });
    };

    // Avatar component
    const Avatar = () => (
        <div className="w-8 h-8 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white shrink-0">
            {alias?.charAt(0).toUpperCase() || userEmail.charAt(0).toUpperCase()}
        </div>
    );

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className={cn(
                        "flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors outline-none",
                        isCollapsed && "justify-center"
                    )}>
                        <Avatar />
                        {!isCollapsed && (
                            <>
                                <div className="flex flex-col items-start mr-1 text-left hidden md:flex">
                                    <span className="text-sm font-semibold text-slate-900 leading-tight">
                                        {alias || 'Användare'}
                                    </span>
                                </div>
                                <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
                            </>
                        )}
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{alias || 'Användare'}</p>
                            <p className="text-xs leading-none text-slate-500 font-normal">{userEmail}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsModalOpen(true)} className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Profilinställningar</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                        onClick={handleLogout} 
                        disabled={isPending}
                        className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{isPending ? 'Loggar ut...' : 'Logga ut'}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <StaffProfileModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userEmail={userEmail}
                initialAlias={alias}
            />
        </>
    );
}
