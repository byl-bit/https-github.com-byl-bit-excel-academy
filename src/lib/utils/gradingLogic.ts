export const calculateGrade = (marks: number): string => {
    if (marks >= 90) return 'A+';
    if (marks >= 80) return 'A';
    if (marks >= 70) return 'B+';
    if (marks >= 60) return 'B';
    if (marks >= 50) return 'C';
    if (marks >= 35) return 'D';
    return 'F';
};

export const calculatePassStatus = (average: number): 'PASS' | 'FAIL' => {
    return average >= 35 ? 'PASS' : 'FAIL';
};

export const calculatePromotionStatus = (isPass: boolean): 'PROMOTED' | 'DETAINED' => {
    return isPass ? 'PROMOTED' : 'DETAINED';
};

export const calculateConduct = (average: number): string => {
    if (average >= 90) return 'Excellent';
    if (average >= 80) return 'Very Good';
    if (average >= 70) return 'Good';
    if (average >= 60) return 'Satisfactory';
    if (average >= 50) return 'Fair';
    return 'Needs Improvement';
};
