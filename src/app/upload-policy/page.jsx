"use client";
import "./page.css";
import { useLanguage } from "../../contexts/LanguageContext";
import { ArrowLeft, FileText, AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UploadPolicy() {
    const { t } = useLanguage();
    const router = useRouter();

    const rules = [
        { id: 1, text: "No slurs, racism, politics, heavily inappropriate things, advertising, etc.", type: "strict" },
        { id: 2, text: "No super-low quality shitposts (we allow some shitposts)", type: "relaxed" },
        { id: 3, text: "No public Arcaea or Taiko no Tatsujin songs", type: "relaxed" },
        { id: 4, text: "Do not abuse our services for the sake of abusing them", type: "strict" },
        { id: 5, text: "No official charts with minor modifications (All Flicks or All Traces are allowed occasionally only)", type: "relaxed" },
        { id: 6, text: "Use some common sense please", type: "strict" },
        { id: 7, text: "No incomplete charts", type: "relaxed" },
    ];

    return (
        <main className="upload-policy-container">
            <div className="upload-policy-content">
                <button onClick={() => router.back()} className="back-btn">
                    <ArrowLeft size={20} />
                    Back
                </button>

                <div className="policy-header">
                    <FileText size={48} className="policy-icon" />
                    <h1>Upload Policy</h1>
                    <p className="policy-subtitle">Please read the following rules before uploading your charts.</p>
                </div>

                <div className="rules-section">
                    <h2><AlertTriangle size={20} /> Rules</h2>
                    <ul className="rules-list">
                        {rules.map((rule) => (
                            <li key={rule.id} className={`rule-item ${rule.type}`}>
                                <span className="rule-number">{rule.id}.</span>
                                <span className="rule-text">{rule.text}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="relaxed-note">
                        <CheckCircle size={18} />
                        <span>Rules 2, 3, 5, and 7 can be <strong>ignored if Unlisted</strong>.</span>
                    </div>
                </div>

                <div className="limits-section">
                    <h2>📦 File Size Limits</h2>
                    <p>
                        If your charts are larger than the upload limit, you can <strong>request support to help</strong>!
                        We don't want to limit actual charts; so we will help you upload it!
                    </p>
                    <p className="shitpost-warning">
                        <AlertTriangle size={16} />
                        Shitposts are not allowed for this exception. Please reconsider your life choices if you're uploading shitposts larger than the file limits.
                    </p>
                </div>

                <div className="filetypes-section">
                    <h2>📄 Supported File Types</h2>
                    <div className="filetypes-list">
                        <span className="filetype-badge">.sus</span>
                        <span className="filetype-badge">.usc</span>
                        <span className="filetype-badge">LevelData</span>
                    </div>
                    <p className="filetypes-note">
                        <strong>Note:</strong> Extreme extended features can only be found in LevelData!
                        You can open .usc in the editor to continue working.
                    </p>
                    <a
                        href="https://next-sekai-editor.sonolus.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="editor-link"
                    >
                        <ExternalLink size={16} />
                        Open Next Sekai Editor
                    </a>
                </div>
            </div>
        </main>
    );
}
