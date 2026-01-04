"use client";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import "./SectionHeader.css";

export default function SectionHeader({
    icon,
    title,
    linkHref,
    linkText = "View All",
    count
}) {
    return (
        <div className="section-header">
            <div className="section-header-left">
                {icon && <span className="section-icon">{icon}</span>}
                <h2 className="section-title">{title}</h2>
                {count !== undefined && (
                    <span className="section-count">{count.toLocaleString()}</span>
                )}
            </div>
            {linkHref && (
                <Link href={linkHref} className="section-link">
                    {linkText}
                    <ChevronRight size={16} />
                </Link>
            )}
        </div>
    );
}
