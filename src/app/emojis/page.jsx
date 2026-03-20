"use client";
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Copy, Check, Search } from 'lucide-react';
import './emojis.css';

export default function EmojisPage() {
    const { t } = useLanguage();
    const [emojis, setEmojis] = useState({});
    const [loading, setLoading] = useState(true);
    const [copiedEmoji, setCopiedEmoji] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetch('/emojis/emojis.json')
            .then(res => res.json())
            .then(data => {
                setEmojis(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load emojis:', err);
                setLoading(false);
            });
    }, []);

    const getEmojiSrc = (config) => {
        if (!config?.image) return null;
        if (config.image.startsWith('http://') || config.image.startsWith('https://')) {
            return config.image;
        }
        return `/emojis/${config.image}`;
    };

    const handleCopy = async (name) => {
        try {
            await navigator.clipboard.writeText(`:${name}:`);
            setCopiedEmoji(name);
            setTimeout(() => setCopiedEmoji(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const filteredEmojis = Object.entries(emojis).filter(([name]) =>
        name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="emojis-page">
            <div className="emojis-container">
                <h1 className="emojis-title">
                    🎨 {t('emojis.title')}
                </h1>
                <p className="emojis-subtitle">
                    {t('emojis.subtitle')}
                    <br />
                    <span style={{ fontSize: '0.8em', color: '#f87171', marginTop: '4px', display: 'block' }}>
                        {t('emojis.disclaimer')}
                    </span>
                </p>

                <div className="emojis-search">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder={t('emojis.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                {loading ? (
                    <div className="emojis-loading">{t('emojis.loading')}</div>
                ) : filteredEmojis.length === 0 ? (
                    <div className="emojis-empty">
                        {searchQuery ? t('emojis.noResults') : t('emojis.noEmojis')}
                    </div>
                ) : (
                    <div className="emojis-grid">
                        {filteredEmojis.map(([name, config]) => (
                            <div
                                key={name}
                                className={`emoji-card ${copiedEmoji === name ? 'copied' : ''}`}
                                onClick={() => handleCopy(name)}
                            >
                                <div className="emoji-image-container">
                                    <img
                                        src={getEmojiSrc(config)}
                                        alt={name}
                                        className="emoji-image"
                                    />
                                </div>
                                <div className="emoji-info">
                                    <span className="emoji-name">{name}</span>
                                    <code className="emoji-command">:{name}:</code>
                                </div>
                                <div className="emoji-copy-indicator">
                                    {copiedEmoji === name ? (
                                        <Check size={16} className="copy-success" />
                                    ) : (
                                        <Copy size={16} />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="emojis-footer">
                    <p>{t('emojis.total').replace('{count}', Object.keys(emojis).length)}</p>
                </div>
            </div>
        </div>
    );
}
