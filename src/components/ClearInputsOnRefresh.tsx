'use client';

import { useEffect } from 'react';

/**
 * Utility component to ensure all form inputs are cleared on page refresh.
 * This overrides common browser behavior of caching form values.
 */
export default function ClearInputsOnRefresh() {
    useEffect(() => {
        // Reset all forms on the page when the component mounts (page load/refresh)
        const forms = document.querySelectorAll('form');
        forms.forEach(form => form.reset());

        // Additionally, find all inputs that might not be in a form and clear them
        const inputs = document.querySelectorAll('input:not([type="submit"]):not([type="button"]), textarea');
        inputs.forEach((input) => {
            const el = input as HTMLInputElement | HTMLTextAreaElement;
            // Only clear if it actually has a value to avoid unnecessary triggers
            if ('value' in el && el.value) {
                el.value = '';
                // Dispatch input/change events for React's controlled components
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    }, []);

    return null;
}
