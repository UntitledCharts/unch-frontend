"use client";
import "./page.css";
import { useLanguage } from "../../contexts/LanguageContext";
import { ArrowLeft, FileText, AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UploadPolicy() {
    const { t } = useLanguage();
    const router = useRouter();

    const rules = [
        { id: 1, text: t('uploadPolicy.rule1'), type: "strict" },
        { id: 2, text: t('uploadPolicy.rule2'), type: "relaxed" },
        { id: 3, text: t('uploadPolicy.rule3'), type: "relaxed" },
        { id: 4, text: t('uploadPolicy.rule4'), type: "strict" },
        { id: 5, text: t('uploadPolicy.rule5'), type: "relaxed" },
        { id: 6, text: t('uploadPolicy.rule6'), type: "strict" },
        { id: 7, text: t('uploadPolicy.rule7'), type: "relaxed" },
        { id: 8, text: t('uploadPolicy.rule8'), type: "relaxed" },
    ];

    return (
        <main className="upload-policy-container">
            <div className="upload-policy-content">
                <button onClick={() => router.back()} className="back-btn">
                    <ArrowLeft size={20} />
                    {t('uploadPolicy.back')}
                </button>

                <div className="policy-header">
                    <FileText size={48} className="policy-icon" />
                    <h1>{t('uploadPolicy.title')}</h1>
                    <p className="policy-subtitle">{t('uploadPolicy.subtitle')}</p>
                </div>

                <div className="rules-section">
                    <h2><AlertTriangle size={20} /> {t('uploadPolicy.rulesTitle')}</h2>
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
                        <span dangerouslySetInnerHTML={{ __html: t('uploadPolicy.relaxedNote') }} />
                    </div>
                </div>

                <div className="limits-section">
                    <h2>📦 {t('uploadPolicy.fileSizeLimits')}</h2>
                    <p dangerouslySetInnerHTML={{ __html: t('uploadPolicy.fileSizeDesc') }} />
                    <p className="shitpost-warning">
                        <AlertTriangle size={16} />
                        {t('uploadPolicy.shitpostWarning')}
                    </p>
                </div>

                <div className="filetypes-section">
                    <h2>📄 {t('uploadPolicy.supportedFileTypes')}</h2>
                    <div className="filetypes-list">
                        <span className="filetype-badge">.sus</span>
                        <span className="filetype-badge">.usc</span>
                        <span className="filetype-badge">LevelData</span>
                    </div>
                    <p className="filetypes-note" dangerouslySetInnerHTML={{ __html: t('uploadPolicy.fileTypesNote') }} />
                    <a
                        href="https://next-sekai-editor.sonolus.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="editor-link"
                    >
                        <ExternalLink size={16} />
                        {t('uploadPolicy.openEditor')}
                    </a>
                </div>
            </div>
        </main>
    );
}
