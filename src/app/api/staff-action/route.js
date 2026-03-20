import { NextResponse } from 'next/server';



const API_URL = process.env.NEXT_PUBLIC_API_URL;
const AUTH_HEADER = process.env.UC_AUTH_HEADER;
const AUTH_TOKEN = process.env.UC_AUTH_TOKEN;

const ACTION_MAP = {
    ban: (id, params) => ({ method: 'PATCH', url: `${API_URL}/api/accounts/${id}/moderation/ban/?delete=${params?.delete || false}` }),
    unban: (id) => ({ method: 'PATCH', url: `${API_URL}/api/accounts/${id}/moderation/unban/` }),
    deleteAccount: (id) => ({ method: 'DELETE', url: `${API_URL}/api/accounts/${id}` }),
    makeMod: (id) => ({ method: 'PATCH', url: `${API_URL}/api/accounts/${id}/staff/mod/` }),
    unmod: (id) => ({ method: 'PATCH', url: `${API_URL}/api/accounts/${id}/staff/unmod/` }),
    makeAdmin: (id) => ({ method: 'PATCH', url: `${API_URL}/api/accounts/${id}/staff/admin/` }),
    unadmin: (id) => ({ method: 'PATCH', url: `${API_URL}/api/accounts/${id}/staff/unadmin/` }),
};

export async function POST(request) {
    try {
        
        if (!AUTH_HEADER || !AUTH_TOKEN) {
            return NextResponse.json(
                { error: 'Staff action proxy is not configured. Set UC_AUTH_HEADER and UC_AUTH_TOKEN env vars.' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { action, targetId, params } = body;

        if (!action || !targetId) {
            return NextResponse.json({ error: 'Missing action or targetId' }, { status: 400 });
        }

        const builder = ACTION_MAP[action];
        if (!builder) {
            return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
        }

        const { method, url } = builder(targetId, params);

        
        const backendRes = await fetch(url, {
            method,
            headers: {
                [AUTH_HEADER]: AUTH_TOKEN,
                'Content-Type': 'application/json',
            },
        });

        const data = await backendRes.json().catch(() => ({}));

        if (!backendRes.ok) {
            return NextResponse.json(
                { error: data.message || data.detail || 'Backend error', status: backendRes.status },
                { status: backendRes.status }
            );
        }

        return NextResponse.json({ result: 'success', data });
    } catch (err) {
        console.error('[staff-action proxy]', err);
        return NextResponse.json({ error: 'Internal proxy error' }, { status: 500 });
    }
}
