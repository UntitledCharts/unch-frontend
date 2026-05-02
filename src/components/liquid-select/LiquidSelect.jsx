"use client";
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import "./LiquidSelect.css";

const LiquidSelect = ({ value, onChange, options, label, icon: Icon, className, type }) => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState({});
    const containerRef = useRef(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleOpen = () => {
        if (!isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const dropUp = spaceBelow < 200 && rect.top > 200;
            const isMobile = window.innerWidth <= 768;

            let left = rect.left;
            const minWidth = Math.max(rect.width, 160);

            if (isMobile && left + minWidth > window.innerWidth - 8) {
                left = Math.max(8, window.innerWidth - minWidth - 8);
            }

            setDropdownStyle({
                position: "fixed",
                left,
                width: minWidth,
                zIndex: 9999999,
                ...(dropUp
                    ? { bottom: window.innerHeight - rect.top + 4 }
                    : { top: rect.bottom + 4 }),
            });
        }
        setIsOpen(v => !v);
    };

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    const dropdown = isOpen && mounted ? createPortal(
        <div
            className={`liquid-select-dropdown liquid-select-portal ${type || ''}`}
            style={dropdownStyle}
        >
            {options.map((opt) => (
                <div
                    key={opt.value}
                    className={`liquid-select-item ${opt.value === value ? 'selected' : ''}`}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        onChange({ target: { value: opt.value } });
                        setIsOpen(false);
                    }}
                >
                    <div className="item-info">
                        {opt.icon && <opt.icon size={16} className="item-icon" />}
                        <span className="item-label">{opt.label}</span>
                    </div>
                    {opt.value === value && type !== 'ghost' && (
                        <div className="selected-indicator">
                            <div className="indicator-dot" />
                        </div>
                    )}
                </div>
            ))}
        </div>,
        document.body
    ) : null;

    return (
        <div className={`liquid-select-wrapper ${className || ''} ${type || ''}`} ref={containerRef}>
            <div
                className={`liquid-select-trigger ${isOpen ? 'active' : ''}`}
                onClick={handleOpen}
            >
                <div className="trigger-content">
                    {Icon && <Icon size={18} className="trigger-icon" />}
                    <span className="trigger-text">{selectedOption ? (selectedOption.label || selectedOption.value) : t('common.select')}</span>
                </div>
                <div className="trigger-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>
            {dropdown}
        </div>
    );
};

export default LiquidSelect;
