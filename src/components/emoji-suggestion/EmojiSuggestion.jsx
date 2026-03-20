"use client";
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { emojis as CUSTOM_EMOJIS } from '@/data/emojis';

const EMOJO_LIST = Object.entries(CUSTOM_EMOJIS).map(([code, config]) => ({
    code,
    char: `:${code}:`,
    isCustom: true,
    image: config.image
}));

export default function EmojiSuggestion({
    value,
    onSelect,
    textareaRef,
    isOpen,
    setIsOpen
}) {
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [filteredEmojis, setFilteredEmojis] = useState([]);

    useEffect(() => {
        if (!textareaRef.current || !value) {
            setIsOpen(false);
            return;
        }

        const cursorPosition = textareaRef.current.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPosition);

        
        
        

        const lastColonIndex = textBeforeCursor.lastIndexOf(':');

        if (lastColonIndex === -1) {
            setIsOpen(false);
            return;
        }

        
        const protocolCheck = textBeforeCursor.substring(Math.max(0, lastColonIndex - 5), lastColonIndex);
        if (protocolCheck.match(/https?$/)) {
            setIsOpen(false);
            return;
        }

        const query = textBeforeCursor.substring(lastColonIndex + 1);

        
        if (query.includes(' ') || query.includes('\n')) {
            setIsOpen(false);
            return;
        }

        setSearchTerm(query);

        const matches = EMOJO_LIST.filter(e => e.code.toLowerCase().startsWith(query.toLowerCase()));
        setFilteredEmojis(matches);

        if (matches.length > 0) {
            setIsOpen(true);
            setSelectedIndex(0);

            
            
            
            const { top, left } = getCaretCoordinates(textareaRef.current, cursorPosition);
            const rect = textareaRef.current.getBoundingClientRect();

            setPosition({
                top: rect.top + window.scrollY + top - textareaRef.current.scrollTop + 20,
                left: rect.left + window.scrollX + left - textareaRef.current.scrollLeft
            });

        } else {
            setIsOpen(false);
        }

    }, [value, textareaRef, setIsOpen]);

    
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredEmojis.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredEmojis.length) % filteredEmojis.length);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                selectEmoji(filteredEmojis[selectedIndex]);
            } else if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredEmojis, selectedIndex]);

    const selectEmoji = (emoji) => {
        if (!emoji) return;

        const cursor = textareaRef.current.selectionStart;
        const text = textareaRef.current.value;
        const lastColon = text.substring(0, cursor).lastIndexOf(':');

        const newText = text.substring(0, lastColon) + emoji.char + " " + text.substring(cursor);

        onSelect(newText);
        setIsOpen(false);

        
        
        setTimeout(() => {
            if (textareaRef.current) {
                const newCursorPos = lastColon + emoji.char.length + 1;
                textareaRef.current.selectionStart = newCursorPos;
                textareaRef.current.selectionEnd = newCursorPos;
                textareaRef.current.focus();
            }
        }, 0);
    };

    if (!isOpen || filteredEmojis.length === 0) return null;

    return createPortal(
        <ul
            style={{
                position: 'absolute',
                top: position.top,
                left: position.left,
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                width: '200px',
                maxHeight: '150px',
                overflowY: 'auto',
                listStyle: 'none',
                padding: '4px',
                margin: 0,
                zIndex: 99999,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
            className="custom-scrollbar"
        >
            {filteredEmojis.map((emoji, index) => (
                <li
                    key={emoji.code}
                    onClick={() => selectEmoji(emoji)}
                    style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        background: index === selectedIndex ? 'rgba(255,255,255,0.1)' : 'transparent',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'white',
                        fontSize: '14px'
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                >
                    <span style={{ fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px' }}>
                        {emoji.isCustom ? (
                            <img
                                src={emoji.image.startsWith('http') ? emoji.image : `/emojis/${emoji.image}`}
                                alt={emoji.code}
                                style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                            />
                        ) : emoji.char}
                    </span>
                    <span style={{ opacity: 0.8 }}>:{emoji.code}:</span>
                </li>
            ))}
        </ul>,
        document.body
    );
}



function getCaretCoordinates(element, position) {
    const div = document.createElement('div');
    const style = window.getComputedStyle(element);

    
    for (const prop of ['direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'fontSizeAdjust', 'lineHeight', 'fontFamily', 'textAlign', 'textTransform', 'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing']) {
        div.style[prop] = style[prop];
    }

    div.textContent = element.value.substring(0, position);

    
    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);

    
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.left = '-9999px';
    document.body.appendChild(div);

    const coordinates = {
        top: span.offsetTop + parseInt(style['borderTopWidth']),
        left: span.offsetLeft + parseInt(style['borderLeftWidth'])
    };

    document.body.removeChild(div);

    return coordinates;
}
