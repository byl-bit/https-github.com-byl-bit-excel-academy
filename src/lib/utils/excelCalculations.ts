// Excel-standard calculation functions

/**
 * Excel SUM function - Sum of all values
 */
export const excelSum = (values: number[]): number => {
    return values.reduce((sum, val) => {
        // Excel treats empty cells as 0, null/undefined as 0
        const num = typeof val === 'number' ? val : 0;
        return sum + num;
    }, 0);
};

/**
 * Excel AVERAGE function - Average of all values
 * Excel ignores empty cells in average calculation
 */
export const excelAverage = (values: number[]): number => {
    const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
    if (validValues.length === 0) return 0;
    const sum = excelSum(validValues);
    return sum / validValues.length;
};

/**
 * Excel RANK function - Returns the rank of a number in a list
 * RANK.EQ behavior: Ties get the same rank, next rank is skipped
 * @param value - The value to rank
 * @param array - Array of values to rank against
 * @param order - 0 or omitted = descending (highest = rank 1), 1 = ascending (lowest = rank 1)
 */
export const excelRank = (value: number, array: number[], order: 0 | 1 = 0): number => {
    // Filter out invalid values
    const validArray = array.filter(v => typeof v === 'number' && !isNaN(v));
    
    if (validArray.length === 0) return 1;
    
    // Sort array based on order
    const sorted = [...validArray].sort((a, b) => order === 0 ? b - a : a - b);
    
    // Find the rank
    let rank = 1;
    for (let i = 0; i < sorted.length; i++) {
        if (order === 0) {
            // Descending: higher values get lower rank numbers
            if (sorted[i] > value) {
                rank++;
            } else if (sorted[i] === value) {
                // Found the value, return its rank
                return rank;
            }
        } else {
            // Ascending: lower values get lower rank numbers
            if (sorted[i] < value) {
                rank++;
            } else if (sorted[i] === value) {
                return rank;
            }
        }
    }
    
    return rank;
};

/**
 * Calculate ranks for all students in a class
 * Returns a map of studentId to rank
 */
export const calculateRanks = (
    results: Array<{ studentId: string; total?: number; average?: number }>,
    useAverage: boolean = true
): { [studentId: string]: number } => {
    const values = results.map(r => useAverage ? (r.average || 0) : (r.total || 0));
    const ranks: { [studentId: string]: number } = {};
    
    results.forEach(result => {
        const value = useAverage ? (result.average || 0) : (result.total || 0);
        ranks[result.studentId] = excelRank(value, values, 0); // 0 = descending (highest gets rank 1)
    });
    
    return ranks;
};

