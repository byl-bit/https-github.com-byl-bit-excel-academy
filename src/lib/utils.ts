
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Normalize gender/sex values across the app.
 * Maps variants like 'male' -> 'M', 'female'/'fimail' -> 'F'.
 * Returns '' for undefined/unknown values.
 */
export function normalizeGender(v?: unknown): string {
    if (v === undefined || v === null) return '';
    const s = String(v).trim().toLowerCase();
    if (!s) return '';

    // Common mappings
    if (s === 'm' || s === 'male' || s === 'man') return 'M';
    if (s === 'f' || s === 'female' || s === 'woman' || s === 'fimail') return 'F';

    // Accept 'sex' synonyms if someone passes 'sex: male' etc.
    if (s.startsWith('m')) return 'M';
    if (s.startsWith('f')) return 'F';

    return '';
}
