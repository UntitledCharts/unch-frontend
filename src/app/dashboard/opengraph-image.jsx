import { ImageResponse } from 'next/og';
import { fontDBBase64, fontEBBase64 } from '../../data/fonts';

export const runtime = 'edge';
export const alt = 'Dashboard - UntitledCharts';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
    const fonts = [];
    try {
        const fontDBBuffer = Uint8Array.from(atob(fontDBBase64), c => c.charCodeAt(0)).buffer;
        const fontEBBuffer = Uint8Array.from(atob(fontEBBase64), c => c.charCodeAt(0)).buffer;
        
        fonts.push({ name: 'Rodin', data: fontDBBuffer, weight: 400, style: 'normal' });
        fonts.push({ name: 'Rodin', data: fontEBBuffer, weight: 700, style: 'normal' });
    } catch (e) {
        console.error('Failed to load fonts for OG image', e);
    }

    return new ImageResponse(
        (
            <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#020617',
                backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.05) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.05) 2%, transparent 0%)',
                backgroundSize: '100px 100px',
                fontFamily: fonts.length > 0 ? 'Rodin' : 'sans-serif',
                position: 'relative'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 32,
                    padding: '80px 120px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 120, height: 120, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', marginBottom: 32 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16v0Z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4v0Z"/><path d="M12 2v2"/><path d="M12 22v-2"/><path d="m17 20.66-1-1.73"/><path d="M11 10.27 7.53 4.27"/><path d="m7 3.34 1 1.73"/><path d="M20.66 7l-1.73 1"/><path d="M3.34 17l1.73-1"/><path d="m14 12 6.13-3.54"/><path d="m22 20l-10-6"/></svg>
                    </div>
                    
                    <h1 style={{ fontSize: 72, fontWeight: 700, color: 'white', margin: 0, padding: 0, letterSpacing: '-0.02em' }}>
                        Creator Dashboard
                    </h1>
                    
                    <p style={{ fontSize: 32, color: '#94a3b8', marginTop: 20, textAlign: 'center', maxWidth: 700, lineHeight: 1.4 }}>
                        Manage your profile, upload new charts, and view your levels
                    </p>
                </div>

                <div style={{ position: 'absolute', bottom: 40, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#38bdf8', letterSpacing: '0.05em' }}>
                        UNTITLED CHARTS
                    </div>
                </div>
            </div>
        ),
        { ...size, fonts }
    );
}
