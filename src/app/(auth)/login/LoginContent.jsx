"use client"

import { useEffect, useState } from "react";
import "./page.css";
import { useUser } from "../../../contexts/UserContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useLanguage();
    const [isWaiting, setIsWaiting] = useState(false);
    const [externalLoginId, setExternalLoginId] = useState(null);
    const [loginError, setLoginError] = useState(null);
    const {
        sonolusUser,
        session,
        isSessionValid,
        clearExpiredSession,
        isClient,
        sessionReady,
    } = useUser();

    useEffect(() => {
        if (!sessionReady) return;

        if (sonolusUser && isSessionValid()) {
            router.push("/dashboard");
        } else {
            setIsWaiting(false);
        }
    }, [sessionReady, sonolusUser, isSessionValid, router]);

    useEffect(() => {
        const reason = searchParams.get('reason');
        const details = searchParams.get('details');

        if (reason === 'expired') {
            let msg = t('login.sessionExpired', "Your session has expired. Please log in again.");
            if (details) {
                msg += ` (Server says: ${decodeURIComponent(details)})`;
            }
            setLoginError(msg);
        }
    }, [searchParams, t]);

    const sonolusServerUrl = process.env['NEXT_PUBLIC_SONOLUS_SERVER_URL'];
    const apiUrl = process.env['NEXT_PUBLIC_API_URL'];

    const getHostFromUrl = (url) => {
        if (!url) return "unch.untitledcharts.com";
        if (url.includes("://")) {
            return url.split("://")[1].split('/')[0];
        }
        return url.split('/')[0];
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setIsWaiting(true);
        setLoginError(null);

        try {
            const res = await fetch(`${apiUrl}/api/accounts/session/external/id/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            if (!res.ok) throw new Error(`Failed to get external login ID: ${res.status}`);
            const { id } = await res.json();

            const host = getHostFromUrl(sonolusServerUrl);

            setExternalLoginId(id);
            const authUrl = `https://open.sonolus.com/external-login/${host}/sonolus/authenticate_external?id=${id}`;
            console.log("Redirecting to:", authUrl);

            window.open(authUrl, '_blank');
        } catch (e) {
            console.error("Login Error:", e);
            setLoginError(t('login.connectionFailed', "Connection failed. Please check your internet or try again."));
            setIsWaiting(false);
        }
    };

    useEffect(() => {
        if (!isWaiting || !externalLoginId) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${apiUrl}/api/accounts/session/external/get/?id=${externalLoginId}`);

                if (res.status === 202) {
                    const { session_key } = await res.json();

                    const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
                    const expiry = Date.now() + oneWeekInMs;

                    localStorage.setItem("session", session_key);
                    localStorage.setItem("expiry", expiry.toString());

                    window.dispatchEvent(new CustomEvent('authChange'));

                    setIsWaiting(false);
                    router.push("/dashboard");
                }
            } catch (e) {
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isWaiting, externalLoginId, apiUrl, router]);

    return (
        <div className="login-box glass-card animate-scale-in">
            {/* Miku Sitting on top of the login box */}
            <div className="mascot-wrapper">
                <img src="/miku-sitting.png" alt="Miku" className="login-mascot" />
            </div>

            <div className="login-header">
                <div className="logo-placeholder"></div>
                <h1>UntitledCharts</h1>
            </div>

            {loginError && (
                <div className="login-error">
                    {loginError}
                </div>
            )}

            {isWaiting ? (
                <div className="waiting-state">
                    <div className="loading-spinner"></div>
                    <p>{t('login.waitingForAuth')}</p>
                    {externalLoginId && (
                        <button
                            onClick={() => {
                                const host = getHostFromUrl(sonolusServerUrl);
                                window.open(`https://open.sonolus.com/external-login/${host}/sonolus/authenticate_external?id=${externalLoginId}`, "_blank", "noopener,noreferrer");
                            }}
                            className="login-btn-primary"
                        >
                            {t('login.openSonolusApp')}
                            <span className="sonolus-icon-wrapper">
                                <img src="https://sonolus.com/logo.png" alt="Sonolus" />
                            </span>
                        </button>
                    )}
                </div>
            ) : (
                <form onSubmit={onSubmit}>
                    <button type="submit" className="login-btn-primary">
                        {t('login.loginVia')}
                        <span className="sonolus-icon-wrapper">
                            <img src="https://sonolus.com/logo.png" alt="Sonolus" />
                        </span>
                    </button>
                </form>
            )}
        </div>
    );
}
