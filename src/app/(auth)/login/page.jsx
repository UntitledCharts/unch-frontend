"use client"

import { Suspense } from "react";
import LoginContent from "./LoginContent";
import LoginBackground from "./LoginBackground";
import "./page.css";

export default function Login() {
  return (
    <main className="login-page">
      <LoginBackground />

      <div className="login-container">
        <Suspense fallback={
          <div className="login-box glass-card">
            <div className="loading-spinner"></div>
          </div>
        }>
          <LoginContent />
        </Suspense>
      </div>
    </main>
  );
}