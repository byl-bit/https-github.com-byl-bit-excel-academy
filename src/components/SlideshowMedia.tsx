'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Media {
    type: 'image' | 'video';
    url: string;
    name?: string | null;
}

interface SlideshowMediaProps {
    media: Media[];
    title: string;
}

export const SlideshowMedia = ({ media, title }: SlideshowMediaProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (media.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % media.length);
        }, 5000); // 5 seconds shuffle

        return () => clearInterval(interval);
    }, [media.length]);

    if (!media || media.length === 0) return null;

    const currentMedia = media[currentIndex];

    return (
        <div className="relative group overflow-hidden rounded-xl border border-blue-100 bg-slate-50 aspect-video w-full shadow-sm hover:shadow-md transition-shadow">
            {currentMedia.type === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={currentMedia.url}
                    alt={`${title} - ${currentIndex + 1}`}
                    className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-700"
                />
            ) : (
                <video
                    src={currentMedia.url}
                    className="w-full h-full object-cover animate-in fade-in duration-700"
                    autoPlay
                    muted
                    loop
                    playsInline
                />
            )}

            {media.length > 1 && (
                <>
                    <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 z-10">
                        {media.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentIndex(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-6 bg-blue-600' : 'w-1.5 bg-white/60 hover:bg-white'
                                    }`}
                                aria-label={`Go to slide ${i + 1}`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={() => setCurrentIndex((prev) => (prev - 1 + media.length) % media.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>

                    <button
                        onClick={() => setCurrentIndex((prev) => (prev + 1) % media.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>

                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-black rounded uppercase tracking-wider z-10">
                        {currentIndex + 1} / {media.length}
                    </div>
                </>
            )}
        </div>
    );
};
