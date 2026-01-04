"use client";

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import './not-found.css';

export default function NotFound() {
    const { t } = useLanguage();

    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <h1 className="not-found-code">404</h1>
                <img src="/error.gif" alt="Error" className="not-found-gif" />
                <h2 className="not-found-title">{t('error.pageNotFound')}</h2>
                <p className="not-found-message">{t('error.pageNotFoundMessage')}</p>
                <Link href="/" className="not-found-button">
                    {t('error.goHome')}
                </Link>
            </div>
        </div>
    );
}
