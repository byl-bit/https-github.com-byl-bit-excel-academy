
import fs from 'fs';
import path from 'path';

function findRouteFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(findRouteFiles(file));
        } else if (file.endsWith('route.ts') || file.endsWith('route.js')) {
            results.push(file);
        }
    });
    return results;
}

const apiDir = 'c:/Users/BYL/Desktop/excel-academy/src/app/api';
const routeFiles = findRouteFiles(apiDir);

routeFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const methods = [];
    if (content.includes('export async function GET')) methods.push('GET');
    if (content.includes('export async function POST')) methods.push('POST');
    if (content.includes('export async function PUT')) methods.push('PUT');
    if (content.includes('export async function DELETE')) methods.push('DELETE');
    if (content.includes('export async function PATCH')) methods.push('PATCH');
    
    console.log(`${file.replace(apiDir, '')}: ${methods.join(', ')}`);
});
