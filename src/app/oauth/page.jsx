"use client";

import { Suspense } from "react";
import OAuthContent from "./OAuthContent";
import "./page.css";

export default function OAuth() {
    return (
        <main className="oauth-container">
            <Suspense fallback={
                <div className="oauth-card glass-card">
                    <div className="loading-spinner"></div>
                </div>
            }>
                <OAuthContent />
            </Suspense>
        </main>
    );
}
