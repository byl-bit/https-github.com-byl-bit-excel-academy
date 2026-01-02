// Advanced search and filter utilities

export interface SearchFilterOptions {
    search?: string;
    grade?: string;
    section?: string;
    status?: string;
    role?: string;
    dateFrom?: string;
    dateTo?: string;
    minScore?: number;
    maxScore?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export const applySearchFilter = <T extends Record<string, unknown>>(
    items: T[],
    options: SearchFilterOptions,
    searchFields: string[] = ['name', 'fullName', 'studentId', 'teacherId']
): T[] => {
    let filtered = [...items];

    // Text search
    if (options.search) {
        const searchLower = options.search.toLowerCase();
        filtered = filtered.filter(item => {
            return searchFields.some(field => {
                const value = item[field];
                return value && String(value).toLowerCase().includes(searchLower);
            });
        });
    }

    // Grade filter
    if (options.grade) {
        filtered = filtered.filter(item => String(item.grade || '') === String(options.grade));
    }

    // Section filter
    if (options.section) {
        filtered = filtered.filter(item => String(item.section || '') === String(options.section));
    }

    // Status filter
    if (options.status) {
        filtered = filtered.filter(item => String(item.status || '') === String(options.status));
    }

    // Role filter
    if (options.role) {
        filtered = filtered.filter(item => String(item.role || '') === String(options.role));
    }

    // Date range filter
    if (options.dateFrom || options.dateTo) {
        filtered = filtered.filter(item => {
            const itemDate = String(item.date ?? item.createdAt ?? item.submittedAt ?? item.publishedAt ?? '');
            if (!itemDate) return false;
            if (options.dateFrom && itemDate < options.dateFrom) return false;
            if (options.dateTo && itemDate > options.dateTo) return false;
            return true;
        });
    }

    // Score range filter (for results)
    if (options.minScore !== undefined || options.maxScore !== undefined) {
        filtered = filtered.filter(item => {
            const score = Number((item as any).average ?? (item as any).total ?? 0);
            if (options.minScore !== undefined && score < options.minScore) return false;
            if (options.maxScore !== undefined && score > options.maxScore) return false;
            return true;
        });
    }

    // Sorting
    if (options.sortBy) {
        filtered.sort((a, b) => {
            const aVal = a[options.sortBy!] || '';
            const bVal = b[options.sortBy!] || '';
            const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            return options.sortOrder === 'desc' ? -comparison : comparison;
        });
    }

    return filtered;
};

export const getUniqueValues = <T extends Record<string, unknown>>(
    items: T[],
    field: string
): string[] => {
    const values = new Set<string>();
    items.forEach(item => {
        const value = item[field];
        if (value !== undefined && value !== null && value !== '') {
            values.add(String(value));
        }
    });
    return Array.from(values).sort();
};

