"use client";

import { useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";

interface AvatarPickerProps {
    avatars: { name: string; url: string }[];
    selectedAvatar: string | undefined;
    onSelect: (url: string) => void;
}

export default function AvatarPicker({
    avatars,
    selectedAvatar,
    onSelect,
}: AvatarPickerProps) {
    const [search, setSearch] = useState("");
    const [isCollapsed, setIsCollapsed] = useState(!!selectedAvatar);

    const filteredAvatars = avatars.filter((avatar) =>
        avatar.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (url: string) => {
        onSelect(url);
        setIsCollapsed(true);
    };

    if (isCollapsed && selectedAvatar) {
        return (
            <div className="flex justify-center py-4 animate-in fade-in zoom-in duration-300">
                <button
                    type="button"
                    onClick={() => setIsCollapsed(false)}
                    className="group relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-indigo-100 hover:ring-indigo-200 transition-all shadow-xl hover:scale-105"
                >
                    <Image
                        src={selectedAvatar}
                        alt="Selected avatar"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 font-medium text-sm bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm transition-opacity">
                            Byt
                        </span>
                    </div>
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
            <input
                type="text"
                placeholder="Sök avatar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus={!selectedAvatar}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                {filteredAvatars.map((avatar) => (
                    <button
                        key={avatar.name}
                        type="button"
                        onClick={() => handleSelect(avatar.url)}
                        className={`group relative aspect-square rounded-full overflow-hidden transition-all duration-200 ease-out ${selectedAvatar === avatar.url
                            ? "ring-4 ring-indigo-500/30 scale-105 shadow-lg"
                            : "hover:ring-4 hover:ring-slate-100 hover:scale-105 opacity-80 hover:opacity-100"
                            }`}
                    >
                        <Image
                            src={avatar.url}
                            alt={avatar.name}
                            fill
                            className="object-cover"
                        />
                        {selectedAvatar === avatar.url && (
                            <div className="absolute inset-0 bg-indigo-600/40 flex items-center justify-center backdrop-blur-[1px]">
                                <Check className="w-8 h-8 text-white drop-shadow-md animate-in zoom-in duration-200" />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
