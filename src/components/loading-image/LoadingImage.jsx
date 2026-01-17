"use client";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import "./LoadingImage.css";

const LOCAL_IMAGE_PREFIXES = [
    "/636a8f1e76b38cb1b9eb0a3d88d7df6f.png",
    "/error.gif",
    "/error.jpg",
    "/file.svg",
    "/globe.svg",
    "/miku-sitting.png",
    "/next.svg",
    "/sonolus-text.png",
    "/vercel.svg",
    "/window.svg",
    "/placeholder"
];

function isLocalImage(src) {
    if (!src) return true;
    if (src.startsWith("data:")) return true;
    for (const prefix of LOCAL_IMAGE_PREFIXES) {
        if (src === prefix || src.startsWith(prefix)) return true;
    }
    return false;
}

export default function LoadingImage({
    src,
    alt,
    className = "",
    style = {},
    loading = "lazy",
    ...rest
}) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const skipLoader = isLocalImage(src);

    useEffect(() => {
        setIsLoaded(false);
        setHasError(false);
    }, [src]);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const handleError = () => {
        setHasError(true);
        setIsLoaded(true);
    };

    if (skipLoader) {
        return (
            <img
                src={src}
                alt={alt}
                className={className}
                style={style}
                loading={loading}
                {...rest}
            />
        );
    }

    return (
        <div className="loading-image-container" style={style}>
            <div className={`loading-image-spinner ${isLoaded ? 'hidden' : ''}`}>
                <Loader2 size={24} />
            </div>
            <img
                src={src}
                alt={alt}
                className={`${className} ${isLoaded ? 'loaded' : ''}`}
                loading={loading}
                onLoad={handleLoad}
                onError={handleError}
                {...rest}
            />
        </div>
    );
}
