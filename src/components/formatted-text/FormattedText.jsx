"use client";
import React, { useState, useEffect } from 'react';
import './FormattedText.css';
import { emojis } from '@/data/emojis';

const FormattedText = ({ text, className = "" }) => {
    const [isLoaded, setIsLoaded] = useState(true);

    
    const emojiConfig = emojis;

    if (!text) return null;

    
    const getEmojiSrc = (emojiConfig) => {
        if (!emojiConfig?.image) return null;
        
        if (emojiConfig.image.startsWith('http://') || emojiConfig.image.startsWith('https://')) {
            return emojiConfig.image;
        }
        
        return `/emojis/${emojiConfig.image}`;
    };

    
    const emojiKeys = Object.keys(emojiConfig);

    
    const pattern = emojiKeys.length > 0
        ? new RegExp(`(${emojiKeys.map(k => `:${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:`).join('|')})`, 'g')
        : /(:mikuslain:)/g;

    const parts = text.split(pattern);

    return (
        <span className={className}>
            {parts.map((part, index) => {
                
                const match = part.match(/^:([^:]+):$/);
                if (match) {
                    const emojiName = match[1];
                    const config = emojiConfig[emojiName];

                    
                    let src = null;
                    if (config) {
                        src = getEmojiSrc(config);
                    } else if (emojiName === 'mikuslain') {
                        src = '/emojis/mikuslain.png';
                    }

                    if (src) {
                        return (
                            <span key={index} className="emoji-wrapper">
                                <img
                                    src={src}
                                    alt={emojiName}
                                    className="inline-emote"
                                />
                                <span className="emoji-tooltip">
                                    <img src={src} alt={emojiName} className="emoji-tooltip-image" />
                                    <span className="emoji-tooltip-name">:{emojiName}:</span>
                                </span>
                            </span>
                        );
                    }
                }
                return part;
            })}
        </span>
    );
};

export default FormattedText;
