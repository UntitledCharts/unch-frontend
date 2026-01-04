"use client";
import React, { useState, useRef, useEffect } from "react";
import "./LiquidSelect.css";

const LiquidSelect = ({ value, onChange, options, label, icon: Icon, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    return (
        <div className={`liquid-select-wrapper ${className || ''}`} ref={containerRef}>
            <div
                className={`liquid-select-trigger ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="trigger-content">
                    {Icon && <Icon size={18} className="trigger-icon" />}
                    <span className="trigger-text">{selectedOption ? (selectedOption.label || selectedOption.value) : "Select..."}</span>
                </div>
                <div className="trigger-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>

            {isOpen && (
                <div className="liquid-select-dropdown">
                    {options.map((opt) => (
                        <div
                            key={opt.value}
                            className={`liquid-select-item ${opt.value === value ? 'selected' : ''}`}
                            onClick={() => {
                                onChange({ target: { value: opt.value } });
                                setIsOpen(false);
                            }}
                        >
                            <div className="item-info">
                                {opt.icon && <opt.icon size={16} className="item-icon" />}
                                <span className="item-label">{opt.label}</span>
                            </div>
                            {opt.value === value && (
                                <div className="selected-indicator">
                                    <div className="indicator-dot" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LiquidSelect;
