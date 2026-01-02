import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const db = {
    read: (filename: string) => {
        try {
            const filePath = path.join(DATA_DIR, `${filename}.json`);
            if (!fs.existsSync(filePath)) {
                // Return appropriate default based on filename
                if (filename.includes('results')) {
                    return {}; // Results and Results Pending are objects, not arrays
                }
                return [];
            }
            const data = fs.readFileSync(filePath, 'utf-8');
            if (!data.trim()) {
                // Handle empty files
                if (filename.includes('results')) {
                    return {};
                }
                return [];
            }
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading ${filename}:`, error);
            // Return appropriate default on error
            if (filename.includes('results')) {
                return {};
            }
            return [];
        }
    },
    write: (filename: string, data: unknown) => {
        try {
            // Ensure data directory exists before writing
            if (!fs.existsSync(DATA_DIR)) {
                fs.mkdirSync(DATA_DIR, { recursive: true });
            }
            const filePath = path.join(DATA_DIR, `${filename}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
            return true;
        } catch (error) {
            console.error(`Error writing ${filename}:`, error);
            return false;
        }
    }
};
