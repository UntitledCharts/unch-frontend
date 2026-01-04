"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import "./LoginBackground.css";

const SONOLUS_SERVER_URL = process.env.NEXT_PUBLIC_SONOLUS_SERVER_URL;

export default function LoginBackground() {
    const [charts, setCharts] = useState([]);

    useEffect(() => {
        const fetchCharts = async () => {
            try {
                const apiBase = process.env.NEXT_PUBLIC_API_URL;
                const randomPage = Math.floor(Math.random() * 5);
                const res = await fetch(`${apiBase}/api/charts?page=${randomPage}&type=quick&limit=50`);

                if (!res.ok) throw new Error("Failed to fetch levels");
                const json = await res.json();

                const items = Array.isArray(json.data) ? json.data : (json.items || []);
                const baseUrl = json.asset_base_url || "";

                const mapped = items.map(item => {
                    const authorHash = item.author;
                    const coverHash = item.jacket_file_hash || (item.cover ? item.cover.hash : null);

                    let coverUrl = "/placeholder.jpg";
                    if (baseUrl && coverHash && authorHash) {
                        coverUrl = `${baseUrl}/${authorHash}/${item.id}/${coverHash}`;
                    } else if (item.coverUrl) {
                        coverUrl = item.coverUrl;
                    }

                    return {
                        id: item.id || item.name,
                        coverUrl
                    };
                }).filter(item => item.coverUrl !== "/placeholder.jpg");

                const enoughItems = mapped.length < 20 ? [...mapped, ...mapped, ...mapped] : mapped;

                const shuffled = enoughItems.sort(() => Math.random() - 0.5);
                setCharts(shuffled);
            } catch (error) {
                console.error("BG Fetch Error:", error);
                setCharts([]);
            }
        };

        fetchCharts();
    }, []);

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.matchMedia("(max-width: 768px)").matches);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (charts.length === 0) return <div className="login-bg-placeholder" />;

    const splitCharts = (arr, parts) => {
        if (!arr.length) return Array.from({ length: parts }, () => []);
        const result = Array.from({ length: parts }, () => []);
        arr.forEach((item, i) => result[i % parts].push(item));
        return result;
    };

    const numColumns = isMobile ? 4 : 8;
    const multipliedCharts = [...charts, ...charts, ...charts, ...charts];
    const columns = splitCharts(multipliedCharts, numColumns);

    return (
        <div className="login-background-container">
            <div className="login-background-overlay" />
            <div className="masonry-marquee-wrapper">
                {columns.map((colItems, colIndex) => (
                    <div
                        key={colIndex}
                        className={`marquee-column column-${colIndex % 2 === 0 ? 'up' : 'down'}`}
                        style={{ animationDuration: `${40 + colIndex * 5}s` }}
                    >
                        {[...colItems, ...colItems].map((chart, i) => (
                            <div key={`${chart.id}-${i}`} className="bg-chart-card">
                                <Image
                                    src={chart.coverUrl}
                                    alt=""
                                    fill
                                    className="bg-chart-img"
                                    unoptimized
                                    style={{ objectFit: 'cover' }}
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
