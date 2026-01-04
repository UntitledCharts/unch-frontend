"use client";

import { usePathname } from "next/navigation";
import NavLinks from "./NavLinks";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { UserProvider, useUser } from "../contexts/UserContext";
import { LanguageProvider, useLanguage } from "../contexts/LanguageContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import BackgroundDecorations from '../components/background-decorations/BackgroundDecorations';
import { Menu, X, Sun, Moon, Globe, User, LogOut } from "lucide-react";
import LiquidSelect from "../components/liquid-select/LiquidSelect";

function HeaderContent() {
    const { isLoggedIn, sonolusUser, handleLogout } = useUser();
    const { t, language, changeLanguage, supportedLangs } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const [showDropdown, setShowDropdown] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const pathname = usePathname();

    const handleMobileMenuClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setMobileMenuOpen(false);
            setIsClosing(false);
        }, 300); // Match animation duration
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showDropdown && !event.target.closest('.user-profile-container')) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showDropdown]);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    const LangPicker = () => {
        const options = Object.entries(supportedLangs).map(([code, lang]) => ({
            value: code,
            label: `${lang.flag} ${lang.name} (${lang.english_name || lang.name})`
        }));

        return (
            <div className="header-control-item">
                <LiquidSelect
                    value={language}
                    onChange={(e) => changeLanguage(e.target.value)}
                    options={options}
                    icon={Globe}
                />
            </div>
        );
    };

    const ThemeToggler = () => (
        <button onClick={toggleTheme} className="header-control-btn" title="Toggle Theme">
            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
    );

    return (
        <>
            <header className="site-header" style={{ display: mobileMenuOpen ? 'none' : 'block' }}>
                <div className="header-container">
                    <div className="header-left">
                        <Link href="/" className="logo-link">
                            <img src="/636a8f1e76b38cb1b9eb0a3d88d7df6f.png" alt={`${t('common.brandName')} Logo`} />
                            <h2>{t('common.brandName')}</h2>
                        </Link>
                    </div>

                    <div className="header-center desktop-only">
                        <Suspense fallback={null}>
                            <NavLinks user={sonolusUser} t={t} />
                        </Suspense>
                    </div>

                    <div className="header-right desktop-only">
                        <LangPicker />
                        <ThemeToggler />

                        {isLoggedIn && sonolusUser ? (
                            <div className="user-profile-container">
                                <div
                                    className="user-profile"
                                    onClick={() => setShowDropdown(!showDropdown)}
                                >
                                    <div className="user-avatar">
                                        <div
                                            className="default-avatar"
                                            style={{
                                                backgroundColor: "#000020ff",
                                                color: "#ffffffff"
                                            }}
                                        >
                                            {sonolusUser.sonolus_username.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    <span className="user-name">{sonolusUser.sonolus_username}</span>
                                    <span className="dropdown-arrow">▼</span>
                                </div>
                                {showDropdown && (
                                    <div className="user-dropdown">
                                        <button
                                            className="dropdown-item logout-btn"
                                            onClick={handleLogout}
                                        >
                                            <LogOut size={16} />
                                            {t('nav.logout')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="user-profile-container">
                                <Link href="/login" className="user-profile login-nav-link" style={{ padding: '6px 16px' }}>
                                    <div className="user-avatar">
                                        <div className="default-avatar" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                                            <User size={14} />
                                        </div>
                                    </div>
                                    <span className="user-name">{t('nav.login')}</span>
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="header-mobile-toggle mobile-only">
                        <button
                            onClick={() => {
                                if (mobileMenuOpen) handleMobileMenuClose();
                                else setMobileMenuOpen(true);
                            }}
                            suppressHydrationWarning
                        >
                            {mobileMenuOpen && !isClosing ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </header>

            {(mobileMenuOpen || isClosing) && (
                <div className={`mobile-menu ${isClosing ? 'animate-slide-up-out' : 'animate-slide-down'}`}>
                    <div className="mobile-menu-header">
                        <Link href="/" onClick={handleMobileMenuClose} className="mobile-logo">
                            <img src="/636a8f1e76b38cb1b9eb0a3d88d7df6f.png" alt="UntitledCharts" />
                        </Link>
                        <button
                            onClick={handleMobileMenuClose}
                            className="mobile-close-btn"
                            aria-label="Close Menu"
                        >
                            <X size={28} />
                        </button>
                    </div>

                    <Suspense fallback={null}>
                        <NavLinks user={sonolusUser} t={t} onNavClick={handleMobileMenuClose} />
                    </Suspense>
                    <div className="mobile-menu-divider"></div>

                    <div className="mobile-menu-controls">
                        <div className="mobile-control-row">
                            <span>{t('header.language', 'Language')}</span>
                            <LangPicker />
                        </div>
                        <div className="mobile-control-row">
                            <span>{t('header.theme', 'Theme')}</span>
                            <ThemeToggler />
                        </div>
                    </div>

                    <div className="mobile-menu-auth">
                        {isLoggedIn && sonolusUser ? (
                            <div className="mobile-user-profile">
                                <div className="user-info">
                                    <div className="user-avatar small">
                                        {sonolusUser.sonolus_username.charAt(0).toUpperCase()}
                                    </div>
                                    <span>{sonolusUser.sonolus_username}</span>
                                </div>
                                <button onClick={handleLogout} className="mobile-logout-btn">
                                    {t('nav.logout')}
                                </button>
                            </div>
                        ) : (
                            <Link href="/login" className="mobile-login-btn" onClick={() => setMobileMenuOpen(false)}>
                                <User size={20} />
                                {t('nav.login')}
                            </Link>
                        )}
                    </div>

                    <div className="mobile-menu-footer">
                        <p>Untitled Charts</p>
                    </div>
                </div>
            )}
        </>
    );
}

function FooterContent() {
    const { language, changeLanguage, supportedLangs, t } = useLanguage();

    return (
        <footer className="site-footer">
            <div className="footer-bg">
                <img src="/636a8f1e76b38cb1b9eb0a3d88d7df6f.png" alt="Logo Background" className="footer-bg-logo" />
            </div>

            <div className="footer-content">
                <div className="footer-left">
                    <img
                        src="/miku-sitting.png"
                        alt="Miku"
                        className="footer-miku"
                    />
                    <h2 className="footer-brand">{t('common.brandName')}</h2>
                    <div className="footer-sonolus-btn-container" style={{ marginTop: '12px' }}>
                        <a
                            className="px-4 py-2 button bg-black text-white inline-flex items-center"
                            href="https://sonolus.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                textDecoration: 'none',
                                transition: 'all 0.2s ease',
                                gap: '8px',
                                background: '#000',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <svg fill="currentColor" aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 4a2 2 0 0 0-2 2v8c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2v-2.5a.5.5 0 0 1 1 0V14a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h2.5a.5.5 0 0 1 0 1H6Zm5-.5c0-.28.22-.5.5-.5h5c.28 0 .5.22.5.5v5a.5.5 0 0 1-1 0V4.7l-4.15 4.15a.5.5 0 0 1-.7-.7L15.29 4H11.5a.5.5 0 0 1-.5-.5Z" fill="currentColor"></path>
                            </svg>
                            {t('footer.openInSonolus')}
                        </a>
                    </div>
                </div>

                <div className="footer-center">
                    <div className="lang-picker" style={{ minWidth: '200px' }}>
                        <LiquidSelect
                            value={language}
                            onChange={(e) => changeLanguage(e.target.value)}
                            options={Object.entries(supportedLangs).map(([code, lang]) => ({
                                value: code,
                                label: `${lang.flag} ${lang.name}`
                            }))}
                        />
                    </div>
                </div>

                <div className="footer-right">
                    <p className="follow-title">{t('footer.followUs')}</p>
                    <div className="social-links">
                        <a href="https://discord.gg/sonolus" target="_blank" rel="noreferrer" aria-label="Discord">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                        </a>
                        <a href="https://twitter.com/sonolus" target="_blank" rel="noreferrer" aria-label="Twitter">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
                        </a>
                        <a href="https://github.com/sonolus" target="_blank" rel="noreferrer" aria-label="GitHub">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>
                        </a>
                    </div>
                </div>
            </div >
        </footer >
    );
}

function RootLayoutInner({ children }) {
    const { t } = useLanguage();
    const pathname = usePathname();
    const isLevelPage = pathname && typeof pathname === 'string' ? pathname.startsWith('/levels/') : false;

    return (
        <>
            <BackgroundDecorations />
            <HeaderContent />
            {isLevelPage ? (
                children
            ) : (
                <main className="main-content">
                    {children}
                </main>
            )}
            <FooterContent />
        </>
    );
}

export default function ClientLayout({ children, variableClasses }) {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <UserProvider>
                    <body className={`${variableClasses} antialiased`}>
                        <RootLayoutInner>
                            {children}
                        </RootLayoutInner>
                    </body>
                </UserProvider>
            </LanguageProvider>
        </ThemeProvider>
    );
}
