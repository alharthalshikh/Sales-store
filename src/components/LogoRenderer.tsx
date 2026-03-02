import React from 'react';

interface LogoRendererProps {
    logo: string;
    size?: number;
    className?: string;
    styles?: React.CSSProperties;
}

/**
 * مكون ذكي لعرض شعار المتجر بأي صيغة (صورة، SVG، أو نص/إيموجي)
 */
const LogoRenderer: React.FC<LogoRendererProps> = ({ logo, size = 32, className = "logo-icon", styles = {} }) => {
    if (!logo) return null;

    const cleanLogo = logo.trim();

    // 1. إذا كان SVG
    if (cleanLogo.startsWith('<svg')) {
        return (
            <div
                className={className}
                style={{
                    width: size,
                    height: size,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...styles
                }}
                dangerouslySetInnerHTML={{ __html: cleanLogo }}
            />
        );
    }

    // 2. إذا كان رابط صورة (HTTP/HTTPS)
    if (cleanLogo.startsWith('http')) {
        return (
            <img
                src={cleanLogo}
                alt="Store Logo"
                className={className}
                style={{
                    width: size,
                    height: size,
                    borderRadius: size < 40 ? 6 : 12,
                    objectFit: 'contain',
                    ...styles
                }}
            />
        );
    }

    // 3. إذا كان إيموجي أو نص عادي
    return (
        <span
            className={className}
            style={{
                fontSize: size * 0.7,
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: size,
                width: 'auto',
                minHeight: size,
                whiteSpace: 'nowrap',
                ...styles
            }}
        >
            {cleanLogo}
        </span>
    );
};

export default LogoRenderer;
