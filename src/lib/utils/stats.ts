// Statistics calculation utilities

export interface SystemStats {
    totalStudents: number;
    activeStudents: number;
    pendingStudents: number;
    totalTeachers: number;
    activeTeachers: number;
    pendingTeachers: number;
    publishedResults: number;
    resultsCount: number;
    pendingResults: number;
    totalAnnouncements: number;
    totalBooks: number;
    studentsByGrade: { [grade: string]: number };
    studentsBySection: { [section: string]: number };
    topAverage: number;
    passRate: number;
}

export const calculateStats = (
    users: { role: string; status: string; grade?: string; section?: string }[],
    results: Record<string, unknown>,
    pendingResults: Record<string, unknown>,
    announcements: unknown[],
    books: unknown[]
): SystemStats => {
    const students = users.filter((u) => u.role === 'student');
    const teachers = users.filter((u) => u.role === 'teacher');

    const studentsByGrade: { [grade: string]: number } = {};
    const studentsBySection: { [section: string]: number } = {};

    students.forEach((s) => {
        if (s.grade) {
            studentsByGrade[s.grade] = (studentsByGrade[s.grade] || 0) + 1;
        }
        if (s.section) {
            studentsBySection[s.section] = (studentsBySection[s.section] || 0) + 1;
        }
    });

    const resultValues = Object.values(results || {});
    const resultsArray = resultValues.filter((r): r is { average?: number } => r !== null && typeof r === 'object');

    const resultsCount = resultsArray.length;
    const topAverage = resultsArray.length > 0
        ? Math.max(...resultsArray.map((r) => r.average || 0))
        : 0;

    const passRate = resultsArray.length > 0
        ? (resultsArray.filter((r) => (r.average || 0) >= 50).length / resultsArray.length) * 100
        : 0;

    return {
        totalStudents: students.length,
        activeStudents: students.filter((s) => s.status === 'active').length,
        pendingStudents: students.filter((s) => s.status === 'pending').length,
        totalTeachers: teachers.length,
        activeTeachers: teachers.filter((t) => t.status === 'active').length,
        pendingTeachers: teachers.filter((t) => t.status === 'pending').length,
        publishedResults: resultsCount,
        resultsCount,
        pendingResults: Object.keys(pendingResults || {}).length,
        totalAnnouncements: announcements?.length || 0,
        totalBooks: books?.length || 0,
        studentsByGrade,
        studentsBySection,
        topAverage,
        passRate,
    };
};

