"use client";
import './ErrorDisplay.css';

export default function ErrorDisplay({ code, message }) {
    return (
        <div className="error-container">
            <div className="error-content">
                <img src="/error.gif" alt="Error" className="error-gif" />
                <div className="error-text">
                    <h1 className="error-code">{code || '???'}</h1>
                    <p className="error-message">{message || 'An unexpected error occurred'}</p>
                </div>
            </div>
        </div>
    );
}
