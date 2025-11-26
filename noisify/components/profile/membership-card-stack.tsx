"use client";

import { useState, useRef, useEffect } from "react";
import { MembershipCard } from "./membership-card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

interface MembershipCardStackProps {
    memberships: any[];
}

export function MembershipCardStack({ memberships }: MembershipCardStackProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    if (!memberships || memberships.length === 0) {
        return (
            <div className="w-full h-[240px] rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                <p className="font-medium mb-2">Inga medlemskap hittades</p>
                <p className="text-sm">Gå med i en organisation för att se ditt medlemskort här.</p>
            </div>
        );
    }

    const handleSwipe = (offset: number) => {
        if (offset > 50 && currentIndex > 0) {
            setDirection(-1);
            setCurrentIndex((prev) => prev - 1);
        } else if (offset < -50 && currentIndex < memberships.length - 1) {
            setDirection(1);
            setCurrentIndex((prev) => prev + 1);
        }
    };

    const handleDragEnd = (e: any, info: PanInfo) => {
        handleSwipe(info.offset.x);
    };

    return (
        <div className="relative w-full max-w-md mx-auto" style={{ height: "280px", perspective: "1000px" }}>
            <div className="relative w-full h-full">
                {memberships.map((membership, index) => {
                    // Only render current, previous, and next cards for performance
                    if (Math.abs(index - currentIndex) > 2) return null;

                    const isCurrent = index === currentIndex;
                    const offset = index - currentIndex;

                    // Calculate transform values
                    const zIndex = 10 - Math.abs(offset);
                    const scale = 1 - Math.abs(offset) * 0.05;
                    const translateY = Math.abs(offset) * 10;
                    const translateZ = -Math.abs(offset) * 50;
                    const opacity = 1 - Math.abs(offset) * 0.3;

                    return (
                        <motion.div
                            key={membership.membership_id}
                            className="absolute top-0 left-0 w-full h-full"
                            initial={false}
                            animate={{
                                scale,
                                y: translateY,
                                z: translateZ,
                                opacity,
                                zIndex,
                                x: offset * 20 // Slight horizontal offset for depth
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            drag={isCurrent ? "x" : false}
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={handleDragEnd}
                            style={{
                                transformStyle: "preserve-3d",
                            }}
                        >
                            <MembershipCard
                                membership={membership}
                                isActive={isCurrent}
                            />
                        </motion.div>
                    );
                })}
            </div>

            {/* Indicators */}
            <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-2">
                {memberships.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300",
                            index === currentIndex
                                ? "w-6 bg-slate-800"
                                : "bg-slate-300 hover:bg-slate-400"
                        )}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
