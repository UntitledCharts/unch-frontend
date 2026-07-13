"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Check, KeyRound, ShieldCheck, Trash2, X } from "lucide-react";
import { useUser } from "../../contexts/UserContext";
import { useLanguage } from "../../contexts/LanguageContext";

const APILink = process.env.NEXT_PUBLIC_API_URL;

// falls back to whatever the backend called the scope if we don't know it
const scopeLabel = (t, scope, fallback) =>
    t(`oauth.scopes.${scope.replace(":", "_")}`, fallback || scope);

function ScopeList({ scopes, t }) {
    return (
        <ul className="oauth-scopes">
            {scopes.map(({ scope, description }) => (
                <li key={scope} className="oauth-scope">
                    <Check size={16} className="oauth-scope-icon" />
                    <div>
                        <span className="oauth-scope-name">{scopeLabel(t, scope, description)}</span>
                        <code className="oauth-scope-raw">{scope}</code>
                    </div>
                </li>
            ))}
        </ul>
    );
}

function Authorize({ session, params }) {
    const router = useRouter();
    const { t } = useLanguage();
    const [app, setApp] = useState(null);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    const clientId = params.get("client_id");
    const redirectUri = params.get("redirect_uri");
    const scope = params.get("scope");
    const state = params.get("state");
    const codeChallenge = params.get("code_challenge");
    const codeChallengeMethod = params.get("code_challenge_method");

    useEffect(() => {
        let stale = false;

        const load = async () => {
            try {
                const query = new URLSearchParams({
                    client_id: clientId || "",
                    redirect_uri: redirectUri || "",
                    scope: scope || "",
                    response_type: params.get("response_type") || "code",
                });
                const res = await fetch(`${APILink}/api/oauth/authorize/?${query}`, {
                    headers: { Authorization: session },
                });
                const data = await res.json();

                if (stale) return;
                if (!res.ok) {
                    setError(data.message || t("oauth.invalidRequest", "This authorization request is not valid."));
                    return;
                }
                setApp(data);
            } catch (e) {
                if (!stale) setError(t("oauth.connectionFailed", "Couldn't reach the server. Please try again."));
            }
        };

        load();
        return () => { stale = true; };
    }, [clientId, redirectUri, scope, session, params, t]);

    const onAuthorize = async () => {
        setSubmitting(true);
        setError(null);

        try {
            const body = {
                client_id: clientId,
                redirect_uri: redirectUri,
                scopes: app.scopes.map((s) => s.scope),
            };
            if (state) body.state = state;
            if (codeChallenge) {
                body.code_challenge = codeChallenge;
                body.code_challenge_method = codeChallengeMethod || "S256";
            }

            const res = await fetch(`${APILink}/api/oauth/authorize/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: session,
                },
                body: JSON.stringify(body),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.message || t("oauth.authorizeFailed", "Could not authorize this app."));
                setSubmitting(false);
                return;
            }

            // hand the code back to the app that asked for it
            window.location.href = data.redirect_uri;
        } catch (e) {
            setError(t("oauth.connectionFailed", "Couldn't reach the server. Please try again."));
            setSubmitting(false);
        }
    };

    if (error && !app) {
        return (
            <div className="oauth-card glass-card animate-scale-in">
                <div className="oauth-error-state">
                    <AlertTriangle size={40} />
                    <h1>{t("oauth.invalidTitle", "Authorization failed")}</h1>
                    <p>{error}</p>
                    <button className="oauth-btn oauth-btn-secondary" onClick={() => router.push("/oauth")}>
                        {t("oauth.viewAuthorized", "View authorized apps")}
                    </button>
                </div>
            </div>
        );
    }

    if (!app) {
        return (
            <div className="oauth-card glass-card">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="oauth-card glass-card animate-scale-in">
            <div className="oauth-header">
                <div className="oauth-icon-badge">
                    <KeyRound size={28} />
                </div>
                <h1>{t("oauth.authorizeTitle", { app: app.name })}</h1>
                <p className="oauth-subtitle">
                    {t("oauth.authorizeSubtitle", { app: app.name })}
                </p>
            </div>

            {app.description && <p className="oauth-app-description">{app.description}</p>}

            <div className="oauth-section">
                <h2>{t("oauth.willBeAbleTo", "This will let it:")}</h2>
                <ScopeList scopes={app.scopes} t={t} />
            </div>

            <p className="oauth-notice">
                <ShieldCheck size={16} />
                {t("oauth.revokeNotice", "You can revoke this at any time from Authorized Apps.")}
            </p>

            {error && <div className="oauth-error">{error}</div>}

            <label className="oauth-confirm">
                <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                />
                <span>
                    {t("oauth.confirmLabel", { app: app.name })}
                </span>
            </label>

            <div className="oauth-actions">
                <button
                    className="oauth-btn oauth-btn-secondary"
                    onClick={() => router.push("/oauth")}
                    disabled={submitting}
                >
                    <X size={18} />
                    {t("oauth.cancel", "Cancel")}
                </button>
                <button
                    className="oauth-btn oauth-btn-primary"
                    onClick={onAuthorize}
                    disabled={submitting || !confirmed}
                >
                    <Check size={18} />
                    {submitting ? t("oauth.authorizing", "Authorizing...") : t("oauth.authorize", "Authorize")}
                </button>
            </div>

            <p className="oauth-redirect-hint">
                {t("oauth.redirectHint", "You will be sent back to")} <code>{app.redirect_uri}</code>
            </p>
        </div>
    );
}

function AuthorizedApps({ session }) {
    const { t, locale } = useLanguage();
    const [apps, setApps] = useState(null);
    const [error, setError] = useState(null);
    const [revoking, setRevoking] = useState(null);

    const load = useCallback(async () => {
        try {
            const res = await fetch(`${APILink}/api/oauth/authorizations/`, {
                headers: { Authorization: session },
            });
            if (!res.ok) throw new Error("failed");
            setApps(await res.json());
        } catch (e) {
            setError(t("oauth.loadFailed", "Couldn't load your authorized apps."));
            setApps([]);
        }
    }, [session, t]);

    useEffect(() => { load(); }, [load]);

    const onRevoke = async (clientId) => {
        setRevoking(clientId);
        try {
            const res = await fetch(`${APILink}/api/oauth/authorizations/${clientId}/`, {
                method: "DELETE",
                headers: { Authorization: session },
            });
            if (!res.ok) throw new Error("failed");
            await load();
        } catch (e) {
            setError(t("oauth.revokeFailed", "Couldn't revoke that app."));
        }
        setRevoking(null);
    };

    const formatDate = (value) =>
        new Date(value).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });

    return (
        <div className="oauth-card oauth-card-wide glass-card animate-scale-in">
            <div className="oauth-header">
                <div className="oauth-icon-badge">
                    <ShieldCheck size={28} />
                </div>
                <h1>{t("oauth.authorizedTitle", "Authorized Apps")}</h1>
                <p className="oauth-subtitle">
                    {t("oauth.authorizedSubtitle", "Apps you've given access to your account. Revoking takes effect immediately.")}
                </p>
            </div>

            {error && <div className="oauth-error">{error}</div>}

            {apps === null ? (
                <div className="loading-spinner"></div>
            ) : apps.length === 0 ? (
                <p className="oauth-empty">
                    {t("oauth.noApps", "You haven't authorized any apps yet.")}
                </p>
            ) : (
                <ul className="oauth-app-list">
                    {apps.map((app) => (
                        <li key={app.client_id} className="oauth-app-item">
                            <div className="oauth-app-head">
                                <div>
                                    <h3>{app.name}</h3>
                                    {app.description && (
                                        <p className="oauth-app-description">{app.description}</p>
                                    )}
                                </div>
                                <button
                                    className="oauth-btn oauth-btn-danger"
                                    onClick={() => onRevoke(app.client_id)}
                                    disabled={revoking === app.client_id}
                                >
                                    <Trash2 size={16} />
                                    {revoking === app.client_id
                                        ? t("oauth.revoking", "Revoking...")
                                        : t("oauth.revoke", "Revoke access")}
                                </button>
                            </div>

                            <ScopeList scopes={app.scopes} t={t} />

                            <p className="oauth-app-meta">
                                {t("oauth.authorizedOn", { date: formatDate(app.authorized_at) })}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function OAuthContent() {
    const router = useRouter();
    const params = useSearchParams();
    const { session, isSessionValid, sessionReady } = useUser();

    const isAuthorizeRequest = !!params.get("client_id");

    useEffect(() => {
        if (!sessionReady) return;

        if (!isSessionValid()) {
            const next = isAuthorizeRequest ? `/oauth?${params.toString()}` : "/oauth";
            router.replace(`/login?next=${encodeURIComponent(next)}`);
        }
    }, [sessionReady, isSessionValid, isAuthorizeRequest, params, router]);

    if (!sessionReady || !isSessionValid() || !session) {
        return (
            <div className="oauth-card glass-card">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return isAuthorizeRequest ? (
        <Authorize session={session} params={params} />
    ) : (
        <AuthorizedApps session={session} />
    );
}
