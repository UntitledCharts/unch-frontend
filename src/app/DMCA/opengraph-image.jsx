import { ImageResponse } from 'next/og';
import { getDecodedFonts } from '../../data/fontLoader';

export const runtime = 'edge';
export const revalidate = 86400;
export const alt = 'Untitled Charts - DMCA Policy';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
    const fonts = getDecodedFonts();

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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 120, height: 120, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', marginBottom: 32 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                    </div>
                    
                    <h1 style={{ fontSize: 72, fontWeight: 700, color: 'white', margin: 0, padding: 0, letterSpacing: '-0.02em' }}>
                        DMCA Policy
                    </h1>
                    
                    <p style={{ fontSize: 32, color: '#94a3b8', marginTop: 20, textAlign: 'center', maxWidth: 700, lineHeight: 1.4 }}>
                        Copyright Infringement Reporting Guidelines
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
