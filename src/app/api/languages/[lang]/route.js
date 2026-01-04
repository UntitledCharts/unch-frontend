import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request, { params }) {
    const { lang } = await params;
    const filePath = path.join(process.cwd(), 'languages', `${lang}.json`);

    try {
        const fileContents = fs.readFileSync(filePath, 'utf8');
        return NextResponse.json(JSON.parse(fileContents));
    } catch (error) {
        return NextResponse.json({ error: 'Language file not found' }, { status: 404 });
    }
}
