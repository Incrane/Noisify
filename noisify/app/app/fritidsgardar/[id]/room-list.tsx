"use client";

import { useState } from "react";
import { Users, Calendar, ArrowRight } from "lucide-react";
import BookingModal from "./booking-modal";

interface Room {
    id: string;
    rum_namn: string;
    kapacitet: number;
    image_url: string | null;
    beskrivning: string | null;
}

interface RoomListProps {
    rooms: Room[];
    orgId: string;
}

export default function RoomList({ rooms, orgId }: RoomListProps) {
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

    return (
        <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => (
                    <div
                        key={room.id}
                        className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all group"
                    >
                        <div className="h-48 bg-slate-100 relative">
                            {room.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={room.image_url} alt={room.rum_namn} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-300 font-bold text-4xl">
                                    {room.rum_namn.charAt(0)}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </div>
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">{room.rum_namn}</h3>
                            <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                                {room.beskrivning || "Ingen beskrivning."}
                            </p>

                            <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                                <div className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4" />
                                    {room.kapacitet} pers
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedRoom(room)}
                                className="w-full flex items-center justify-center gap-2 bg-white border-2 border-indigo-600 text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
                            >
                                <Calendar className="w-4 h-4" />
                                Boka rum
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedRoom && (
                <BookingModal
                    room={selectedRoom}
                    orgId={orgId}
                    isOpen={!!selectedRoom}
                    onClose={() => setSelectedRoom(null)}
                />
            )}
        </>
    );
}
