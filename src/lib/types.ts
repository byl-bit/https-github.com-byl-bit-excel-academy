export interface Subject {
    name: string;
    marks?: number;
    assessments?: Record<string, number>;
    status?: string;
    submittedAt?: string;
    submittedBy?: string;
    approvedBy?: string;
    approvedAt?: string;
    grade?: string;
}

export interface AssessmentType {
    id: string;
    maxMarks?: number | string;
    weight?: number | string;
    label?: string;
}

export interface PendingResult {
    student_id: string;
    studentId?: string;
    student_name?: string;
    studentName?: string;
    subjects?: Subject[];
    total?: number;
    average?: number;
    grade?: string;
    section?: string;
    status?: string;
    submitted_by?: string;
    submittedAt?: string;
    submitted_at?: string;
    submissionLevel?: string;
    submission_level?: string;
    rank?: number | null;
    conduct?: string | null;
    result?: string | null;
    promoted_or_detained?: string | null;
    promotedOrDetained?: string | null;
    roll_number?: string | null;
    rollNumber?: string | null;
    updated_at?: string;
    id?: string;
    gender?: string | null;
}

export interface PublishedResult extends PendingResult {
    published_at?: string;
    approved_by?: string;
    approved_at?: string;
}

export interface User {
    id?: string;
    student_id?: string;
    studentId?: string;
    teacher_id?: string;
    teacherId?: string;
    name?: string;
    fullName?: string;
    studentName?: string;
    grade?: string | number;
    section?: string | number;
    gender?: string;
    sex?: string;
    role?: string;
    rollNumber?: string | null;
}

export interface Allocation {
    id?: string;
    teacher_id?: string;
    grade?: string | number;
    section?: string | number;
}

export interface Setting{
    key: string;
    value: unknown;
}
