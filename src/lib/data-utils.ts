/**
 * Data transformation and validation helpers shared across the app.
 */

/**
 * Safely get a string value from a record.
 * Coerces numbers and booleans to strings.
 */
export function getString(o: unknown, k: string): string | undefined {
  if (typeof o !== "object" || o === null) return undefined;
  const v = (o as any)[k];
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return undefined;
}

/**
 * Check if a value is a non-null object.
 */
export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Normalize grade strings (e.g., 'Grade 9' -> '9').
 * Returns 'all' for undefined or 'all' values.
 */
export function normalizeGrade(g: unknown): string {
  if (!g) return "all";
  const str = String(g).trim().toLowerCase();
  if (str === "all" || str === "undefined" || str === "") return "all";
  const match = str.match(/\d+/);
  return match ? match[0] : str;
}

/**
 * Normalize gender/sex values across the app.
 */
export function normalizeGender(v?: unknown): string {
  if (v === undefined || v === null) return "";
  const s = String(v).trim().toLowerCase();
  if (!s) return "";

  if (s === "m" || s === "male" || s === "man") return "M";
  if (s === "f" || s === "female" || s === "woman" || s === "fimail") return "F";

  if (s.startsWith("m")) return "M";
  if (s.startsWith("f")) return "F";

  return "";
}

/**
 * Calculate the average of subjects, handling semester-specific marks.
 */
export function calculateAnnualAverage(subjects: any[]): number {
  if (!subjects || subjects.length === 0) return 0;
  
  const total = subjects.reduce((sum, sub) => {
    const marks = Number(sub.marks || 0);
    return sum + marks;
  }, 0);
  
  return total / subjects.length;
}

/**
 * Calculate semester averages.
 */
export function calculateSemesterAverage(subjects: any[], semester: 1 | 2): number {
  if (!subjects || subjects.length === 0) return 0;
  
  const key = semester === 1 ? "sem1" : "sem2";
  const total = subjects.reduce((sum, sub) => {
    // Fallback for sem1 if only annual marks exist
    const val = sub[key] || (semester === 1 && sub.marks && !sub.sem2 ? sub.marks : 0);
    return sum + Number(val || 0);
  }, 0);
  
  return total / subjects.length;
}
