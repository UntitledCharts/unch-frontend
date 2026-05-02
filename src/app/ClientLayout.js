"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import NavLinks from "./NavLinks";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { UserProvider, useUser } from "../contexts/UserContext";
import { LanguageProvider, useLanguage } from "../contexts/LanguageContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { AudioPlayerProvider } from "../contexts/AudioPlayerContext";
import BackgroundDecorations from '../components/background-decorations/BackgroundDecorations';
const MiniPlayer = dynamic(() => import('../components/mini-player/MiniPlayer'), { ssr: false });
import NavigationProgress from '../components/navigation-progress/NavigationProgress';
import { Menu, X, Sun, Moon, Globe, User, LogOut } from "lucide-react";
import LiquidSelect from "../components/liquid-select/LiquidSelect";

function HeaderContent() {
    const { isLoggedIn, sonolusUser, assetBaseUrl, handleLogout } = useUser();
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
        }, 300); 
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
            label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <img src={`https://flagcdn.com/w40/${lang.country}.png`} alt="" width={20} height={15} style={{ borderRadius: 2, objectFit: 'cover' }} />
                {lang.name} ({lang.english_name || lang.name})
            </span>
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
                                    className="user-profile redesigned-trigger"
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    style={{
                                        backgroundImage: `url(${sonolusUser.banner_hash && assetBaseUrl
                                            ? `${assetBaseUrl}/${sonolusUser.sonolus_id}/banner/${sonolusUser.banner_hash}_webp`
                                            : '/def.webp'})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                                    }}
                                >
                                    <div className="trigger-overlay"></div>

                                    <div className="user-avatar" style={{ zIndex: 2, position: 'relative' }}>
                                        <img
                                            src={sonolusUser.profile_hash && assetBaseUrl
                                                ? `${assetBaseUrl}/${sonolusUser.sonolus_id}/profile/${sonolusUser.profile_hash}_webp`
                                                : "/defpfp.webp"
                                            }
                                            alt="Avatar"
                                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', background: '#000020' }}
                                            onError={(e) => { e.target.src = "/defpfp.webp"; }}
                                        />
                                    </div>
                                    <span className="user-name">
                                        {sonolusUser.sonolus_username}
                                    </span>
                                    <span className="dropdown-arrow" style={{ zIndex: 2, position: 'relative' }}>▼</span>
                                </div>
                                {showDropdown && (
                                    <div className="user-dropdown">
                                        <Link
                                            href={`/user/${sonolusUser.sonolus_handle || sonolusUser.sonolus_id}`}
                                            className="dropdown-item"
                                            onClick={() => setShowDropdown(false)}
                                        >
                                            <User size={16} />
                                            {t('nav.profile', 'Profile')}
                                        </Link>
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
                                <Link href="/login" className="user-profile login-nav-link" style={{ padding: '6px 16px 6px 6px' }}>
                                    <div className="user-avatar">
                                        <div className="default-avatar">
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
                            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                        >
                            {mobileMenuOpen && !isClosing ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </header>

            {(mobileMenuOpen || isClosing) && (
                <div className={`mobile-menu ${isClosing ? 'animate-slide-up-out' : 'animate-slide-down'}`}>
                    <div className="mobile-menu-expanded-header">
                        <Link href="/" onClick={handleMobileMenuClose} className="mobile-logo">
                            <img src="/636a8f1e76b38cb1b9eb0a3d88d7df6f.png" alt="UntitledCharts" />
                            <span className="mobile-logo-text">UntitledCharts</span>
                        </Link>
                        <button
                            onClick={handleMobileMenuClose}
                            className="mobile-close-btn-enhanced"
                            aria-label="Close Menu"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="mobile-menu-body">
                        <Suspense fallback={null}>
                            <NavLinks user={sonolusUser} t={t} onNavClick={handleMobileMenuClose} isMobile={true} />
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
                                <div className="mobile-user-profile" style={{
                                    backgroundImage: `url(${sonolusUser.banner_hash && assetBaseUrl
                                        ? `${assetBaseUrl}/${sonolusUser.sonolus_id}/banner/${sonolusUser.banner_hash}_webp`
                                        : '/def.webp'})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    position: 'relative',
                                    padding: '20px',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    marginBottom: '20px'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.8))',
                                        zIndex: 1
                                    }} />

                                    <div className="user-info" style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div className="user-avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', overflow: 'hidden', background: '#000' }}>
                                            <img
                                                src={sonolusUser.profile_hash && assetBaseUrl
                                                    ? `${assetBaseUrl}/${sonolusUser.sonolus_id}/profile/${sonolusUser.profile_hash}_webp`
                                                    : "/defpfp.webp"
                                                }
                                                alt="Avatar"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => { e.target.src = "/defpfp.webp"; }}
                                            />
                                        </div>
                                        <span style={{ fontWeight: '700', fontSize: '1.1rem', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                            {sonolusUser.sonolus_username}
                                        </span>
                                    </div>

                                    <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '8px' }}>
                                        <Link
                                            href={`/user/${sonolusUser.sonolus_handle || sonolusUser.sonolus_id}`}
                                            className="mobile-logout-btn"
                                            style={{ flex: 1, background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', textDecoration: 'none', justifyContent: 'center', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', padding: '10px', borderRadius: '8px', fontWeight: '600' }}
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            {t('nav.profile', 'Profile')}
                                        </Link>
                                        <button onClick={handleLogout} className="mobile-logout-btn" style={{ flex: 1, justifyContent: 'center', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', padding: '10px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                                            {t('nav.logout')}
                                        </button>
                                    </div>
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
                <img src="/636a8f1e76b38cb1b9eb0a3d88d7df6f.png" alt="Logo Background" className="footer-bg-logo" width="160" height="160" />
            </div>

            <div className="footer-content">
                <div className="footer-left">
                    <img
                        src="/miku-sitting.png"
                        alt="Miku"
                        className="footer-miku"
                        width="80"
                        height="120"
                    />
                    <h2 className="footer-brand">{t('common.brandName')}</h2>
                    <div className="footer-sonolus-btn-container" style={{ marginTop: '12px' }}>
                        <a
                            className="px-4 py-2 button bg-black text-white inline-flex items-center"
                            href="https://open.sonolus.com/untitledcharts.com/"
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
                                label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                    <img src={`https://flagcdn.com/w40/${lang.country}.png`} alt="" width={20} height={15} style={{ borderRadius: 2, objectFit: 'cover' }} />
                                    {lang.name}
                                </span>
                            }))}
                        />
                    </div>
                    <div className="footer-links" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <Link href="/DMCA" className="footer-link" style={{ color: 'var(--foreground-muted)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500', transition: 'all 0.2s' }}>
                            DMCA & Copyright
                        </Link>
                    </div>
                </div>

                <div className="footer-right">
                    <p className="follow-title">{t('footer.followUs')}</p>
                    <div className="social-links">
                        <a href="https://discord.com/invite/mH3xWPPdEY" target="_blank" rel="noreferrer" aria-label="Discord">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                            </svg>
                        </a>
                        <a href="https://www.tiktok.com/@untitledcharts" target="_blank" rel="noreferrer" aria-label="TikTok">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                            </svg>
                        </a>
                        <a href="https://www.youtube.com/@UntitledCharts" target="_blank" rel="noreferrer" aria-label="YouTube">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function RootLayoutInner({ children }) {
    const { t } = useLanguage();
    const pathname = usePathname();
    const isLevelPage = pathname && typeof pathname === 'string' ? pathname.startsWith('/levels/') : false;

    useEffect(() => {
        const art = [
            '%c',
            '██╗░░░██╗███╗░░██╗████████╗██╗████████╗██╗░░░░░███████╗██████╗░',
            '██║░░░██║████╗░██║╚══██╔══╝██║╚══██╔══╝██║░░░░░██╔════╝██╔══██╗',
            '██║░░░██║██╔██╗██║░░░██║░░░██║░░░██║░░░██║░░░░░█████╗░░██║░░██║',
            '██║░░░██║██║╚████║░░░██║░░░██║░░░██║░░░██║░░░░░██╔══╝░░██║░░██║',
            '╚██████╔╝██║░╚███║░░░██║░░░██║░░░██║░░░███████╗███████╗██████╔╝',
            '░╚═════╝░╚═╝░░╚══╝░░░╚═╝░░░╚═╝░░░╚═╝░░░╚══════╝╚══════╝╚═════╝░',
            '',
            '░█████╗░██╗░░██╗░█████╗░██████╗░████████╗░██████╗',
            '██╔══██╗██║░░██║██╔══██╗██╔══██╗╚══██╔══╝██╔════╝',
            '██║░░╚═╝███████║███████║██████╔╝░░░██║░░░╚█████╗░',
            '██║░░██╗██╔══██║██╔══██║██╔══██╗░░░██║░░░░╚═══██╗',
            '╚█████╔╝██║░░██║██║░░██║██║░░██║░░░██║░░░██████╔╝',
            '░╚════╝░╚═╝░░╚═╝╚═╝░░╚═╝╚═╝░░╚═╝░░░╚═╝░░░╚═════╝░',
        ].join('\n');

        console.log(art, 'color: #38bdf8; font-family: monospace; font-size: 10px; line-height: 1.2;');
        console.log('%cHello! Welcome to the browser console. Don\'t go here unless you know what you are doing. :3', 'color: #94a3b8; font-size: 13px; font-style: italic;');
    }, []);

    return (
        <>
            <BackgroundDecorations />
            <Suspense fallback={null}>
                <NavigationProgress />
            </Suspense>
            <HeaderContent />
            {isLevelPage ? (
                <div className="animate-page-enter">
                    {children}
                </div>
            ) : (
                <main className="main-content" style={{ flex: 1 }}>
                    <div className="animate-page-enter">
                        {children}
                    </div>
                </main>
            )}
            <MiniPlayer />
            <FooterContent />
        </>
    );
}

export default function ClientLayout({ children, variableClasses }) {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <UserProvider>
                    <AudioPlayerProvider>
                    <body className={`${variableClasses} antialiased`}>
                        <RootLayoutInner>
                            {children}
                        </RootLayoutInner>
                    </body>
                    </AudioPlayerProvider>
                </UserProvider>
            </LanguageProvider>
        </ThemeProvider>
    );
}
