"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import './error.css';

export default function Error({ error, reset }) {
    const { t } = useLanguage();

    
    const isChunkError = error?.message?.includes('chunk') ||
        error?.message?.includes('module') ||
        error?.message?.includes('Loading') ||
        error?.digest?.includes('NEXT_');

    
    const is404 = error?.message?.includes('not found') ||
        error?.message?.includes('404') ||
        error?.message?.includes('private') ||
        error?.message?.includes('Private');

    if (isChunkError) {
        
        setTimeout(() => reset(), 1000);
        return null;
    }

    if (is404) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <img src="/error.gif" alt="404" style={{ width: '200px', marginBottom: '24px' }} />
                <h1 style={{ fontSize: '2rem', color: 'white', margin: '0 0 12px' }}>404 - Page Not Found</h1>
                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px' }}>This page doesn't exist or is private.</p>
                <a href="/" style={{ padding: '12px 24px', background: '#66ccff', color: '#0a0d14', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
                    Go Home
                </a>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <img src="/error.gif" alt="Error" style={{ width: '200px', marginBottom: '24px' }} />
            <h1 style={{ fontSize: '1.5rem', color: 'white', margin: '0 0 12px' }}>{t('error.somethingWentWrong', 'Something went wrong!')}</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px', textAlign: 'center' }}>{error.message || t('error.errorMessage', 'An unexpected error occurred.')}</p>
            <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => reset()} style={{ padding: '12px 24px', background: '#66ccff', color: '#0a0d14', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                    {t('error.tryAgain', 'Try Again')}
                </button>
                <a href="/" style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
                    {t('error.goHome', 'Go Home')}
                </a>
            </div>
        </div>
    );
}
