'use client';

import React from 'react';

export const FormattedText = ({ text }: { text: string }) => {
    if (!text) return null;

    // Regex to identify URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    const parts = text.split(urlRegex);

    return (
        <span className="whitespace-pre-wrap wrap-break-word border-none bg-transparent p-0 text-inherit font-inherit">
            {parts.map((part, i) => {
                if (part.match(urlRegex)) {
                    return (
                        <a
                            key={i}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline decoration-blue-500/30 underline-offset-2 hover:decoration-blue-700 transition-all font-bold"
                        >
                            {part}
                        </a>
                    );
                }
                return part;
            })}
        </span>
    );
};
