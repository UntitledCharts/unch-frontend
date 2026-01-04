import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    const filePath = path.join(process.cwd(), 'supported.json');

    try {
        const fileContents = fs.readFileSync(filePath, 'utf8');
        return NextResponse.json(JSON.parse(fileContents));
    } catch (error) {
        return NextResponse.json({ error: 'Supported languages file not found' }, { status: 404 });
    }
}
