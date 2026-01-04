"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import './error.css';

export default function Error({ error, reset }) {
    const { t } = useLanguage();

    return (
        <div className="error-container">
            <div className="error-content">
                <div className="error-gif-container">
                    <img src="/error.gif" alt="Error" className="error-gif" />
                </div>
                <h1 className="error-title">{t('error.somethingWentWrong')}</h1>
                <p className="error-message">{t('error.errorMessage')}</p>
                <div className="error-actions">
                    <button onClick={() => reset()} className="error-button retry">
                        {t('error.tryAgain')}
                    </button>
                    <a href="/" className="error-button home">
                        {t('error.goHome')}
                    </a>
                </div>
            </div>
        </div>
    );
}
