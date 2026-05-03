'use client';
import { useLanguage } from '../../contexts/LanguageContext';
import Link from 'next/link';
import { MessageSquare, Edit3, ArrowLeft, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';
import './page.css';

const DISCORD_SVG = (
    <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="currentColor">
        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77.67,77.67,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.09,53,91.04,65.69,84.69,65.69Z" />
    </svg>
);

export default function DMCAPage() {
    const { t } = useLanguage();

    return (
        <main className="dmca-page animate-fade-in">
            <div className="dmca-orb dmca-orb-1" />
            <div className="dmca-orb dmca-orb-2" />
            <div className="dmca-orb dmca-orb-3" />

            <div className="dmca-inner">
                <Link href="/" className="dmca-back">
                    <ArrowLeft size={16} />
                    {t('dmca.backToHome')}
                </Link>

                <div className="dmca-hero">
                    <h1 className="dmca-title">{t('dmca.title')}</h1>
                    <p className="dmca-subtitle">{t('dmca.subtitle')}</p>
                </div>

                <div className="dmca-timeline">

                    {/* Step 1 */}
                    <div className="dmca-step">
                        <div className="dmca-step-aside">
                            <div className="dmca-step-num">1</div>
                            <div className="dmca-step-line" />
                        </div>
                        <div className="dmca-step-body">
                            <h2>{t('dmca.step1Title')}</h2>
                            <p>{t('dmca.step1Desc')}</p>
                            <a href="https://discord.com/invite/mH3xWPPdEY" target="_blank" rel="noreferrer" className="dmca-discord-btn">
                                {DISCORD_SVG}
                                {t('dmca.joinDiscord')}
                                <ChevronRight size={16} />
                            </a>
                            <div className="dmca-gif-wrap">
                                <img src="/guidegifs/guide1.gif" alt="Guide step 1" />
                            </div>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="dmca-step">
                        <div className="dmca-step-aside">
                            <div className="dmca-step-num">2</div>
                            <div className="dmca-step-line" />
                        </div>
                        <div className="dmca-step-body">
                            <h2>{t('dmca.step2Title')}</h2>
                            <p dangerouslySetInnerHTML={{ __html: t('dmca.step2Desc') }} />
                            <div className="dmca-gif-wrap">
                                <img src="/guidegifs/guide2.gif" alt="Guide step 2" />
                            </div>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="dmca-step">
                        <div className="dmca-step-aside">
                            <div className="dmca-step-num">3</div>
                        </div>
                        <div className="dmca-step-body">
                            <h2>{t('dmca.step3Title')}</h2>
                            <p>{t('dmca.step3Desc')}</p>
                            <ul className="dmca-checklist">
                                <li><CheckCircle size={15} />{t('dmca.step3Item1')}</li>
                                <li><CheckCircle size={15} />{t('dmca.step3Item2')}</li>
                                <li><CheckCircle size={15} />{t('dmca.step3Item3')}</li>
                            </ul>
                        </div>
                    </div>

                </div>

                <div className="dmca-note">
                    <AlertTriangle size={18} />
                    <span>{t('dmca.falseClaims', 'False DMCA claims or any misuse of this process will result in a 1 week timeout.')}</span>
                </div>
            </div>
        </main>
    );
}
