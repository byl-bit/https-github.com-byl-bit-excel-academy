
export type Role = 'admin' | 'student' | 'teacher';
export type Status = 'active' | 'pending';

export interface User {
    id: string; // Internal User ID (e.g., u1)
    name: string;
    fullName?: string; // For backward compatibility
    email: string;
    password?: string; // For mock auth
    role: Role;
    status: Status;
    studentId?: string; // The "Unique ID" (e.g., ST-2025-001)
    teacherId?: string; // The teacher unique ID (e.g., TE-2025-001)
    grade?: string;
    section?: string;
    photo?: string; // URL or Base64 string for profile photo
    createdAt?: string;
    gender?: string;
}

export interface SubjectResult {
    name: string;
    marks: number; // Out of 100
    grade?: string; // A, B, C, etc.
    status?: 'draft' | 'submitted_to_homeroom' | 'submitted_to_admin' | 'published';
    submittedBy?: string;
    submittedAt?: string;
    assessments?: { [key: string]: number }; // For dynamic assessment types
}

export interface SubjectAllocation {
    id: string;
    teacherId: string;
    teacherName: string;
    grade: string;
    section: string;
    subject: string; // Single subject per allocation
    // Optional Database keys
    teacher_id?: string;
    teacher_name?: string;
}

export interface StudentResult {
    id: string;
    studentId: string; // Links to User.studentId
    studentName: string;
    grade: string;
    section: string;
    subjects: SubjectResult[];
    total: number;
    average: number;
    rank: number;
    conduct: string;
    result: 'PASS' | 'FAIL';
    promotedOrDetained: 'PROMOTED' | 'DETAINED';
    status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED'; // New field for approval workflow
    teacherId?: string; // ID of the teacher who submitted this
    submittedAt?: string;
    approvedAt?: string;
    remarks?: string; // tailored remarks
}

export interface Announcement {
    id: string;
    title: string;
    body: string;
    date: string;
    type: 'general' | 'academic' | 'event';
    imageUrl?: string; // Backwards-compatible single image field
    media?: Array<{ type: 'image' | 'video'; url: string; name?: string | null }>;
}



export const MOCK_USERS: User[] = [
    {
        id: 'u1',
        name: 'Admin User',
        email: 'administrator@excel.edu',
        password: 'admin123',
        role: 'admin',
        status: 'active'
    },
    {
        id: 't1',
        name: 'Mr. Teacher',
        email: 'teacher@excel.edu',
        password: 'teach123',
        role: 'teacher',
        status: 'active',
        teacherId: 'TE-2025-0001',
        grade: '10',
        section: 'A'
    },
    {
        id: 'u2',
        name: 'John Doe',
        email: 'john@excel.edu',
        password: 'password123',
        role: 'student',
        status: 'active',
        studentId: 'ST-2025-001',
        grade: '10',
        section: 'A'
    },
    {
        id: 'u3',
        name: 'Jane Smith',
        email: 'jane@excel.edu',
        password: 'password123',
        role: 'student',
        status: 'active',
        studentId: 'ST-2025-002',
        grade: '11',
        section: 'B'
    }
];

// Helper to generate results for all mock students
const generateMockResults = (): StudentResult[] => {
    return MOCK_USERS
        .filter(u => u.role === 'student' && u.studentId)
        .map((student, index) => {
            // Generate random marks
            const subjectsList = ['Amharic', 'Afan Oromo', 'Maths', 'Physics', 'Biology', 'History', 'Citizenship', 'ICT', 'Economics', 'Agriculture', 'WDD', 'HPE'];
            const subjects: SubjectResult[] = subjectsList.map(sub => ({
                name: sub,
                marks: Math.floor(Math.random() * 40) + 60 // Marks between 60 and 100
            }));

            const total = subjects.reduce((sum, sub) => sum + sub.marks, 0);
            const average = Math.round(total / subjects.length);
            const isPass = average >= 50;

            const resultData: StudentResult = {
                id: `r${index + 1}`,
                studentId: student.studentId!,
                studentName: student.name,
                grade: student.grade!,
                section: student.section!,
                subjects,
                total,
                average,
                rank: 0, // Rank needs to be calculated relative to others, skipping for simple mock
                conduct: ['Excellent', 'Good', 'Satisfactory'][Math.floor(Math.random() * 3)],
                result: isPass ? 'PASS' : 'FAIL',
                promotedOrDetained: isPass ? 'PROMOTED' : 'DETAINED',
                status: 'PUBLISHED'
            };
            return resultData;
        })
        // Simple mock rank calculation (not perfect across grades but works for demo)
        .sort((a, b) => b.average - a.average)
        .map((res, idx) => ({ ...res, rank: idx + 1 }));
};

export const MOCK_RESULTS: StudentResult[] = generateMockResults();

export const MOCK_ANNOUNCEMENTS: Announcement[] = [];
