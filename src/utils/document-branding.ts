import { applyBrandDisplayFont, applyBrandFont, applyPrimaryColor } from './apply-branding';
import { getAppName, LOGO_CANDIDATES } from './branding';
import { isPreviewMode } from './is-preview-mode';
import brandConfig from '../../brand.config.json';

export function applyDocumentTitle(): void {
    const name = getAppName();
    if (name) document.title = name;
}

export function setFaviconHref(href: string, type = 'image/png'): void {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    link.type = type;
    link.href = href;
}

export function buildLetterFaviconUri(appName: string = getAppName()): string {
    const letter = appName.trim().charAt(0).toUpperCase() || 'A';
    const bgColor =
        getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim() ||
        brandConfig?.colors?.primary ||
        '#000000';
    const svg = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">',
        `<rect width="32" height="32" rx="6" fill="${bgColor}"/>`,
        '<text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"',
        ` fill="white" font-size="20" font-family="sans-serif" font-weight="bold">${letter}</text>`,
        '</svg>',
    ].join('');

    const base64 = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${base64}`;
}

export function applyFaviconFromLogo(): void {
    if (isPreviewMode()) {
        setFaviconHref(buildLetterFaviconUri(), 'image/svg+xml');
        return;
    }

    const tryCandidate = (index: number): void => {
        if (index >= LOGO_CANDIDATES.length) {
            setFaviconHref(buildLetterFaviconUri(), 'image/svg+xml');
            return;
        }
        const src = LOGO_CANDIDATES[index];
        const img = new Image();
        img.onload = () => setFaviconHref(src);
        img.onerror = () => tryCandidate(index + 1);
        img.src = src;
    };
    tryCandidate(0);
}

export function applyBrandFontFromConfig(): void {
    const fonts = brandConfig?.typography?.font_family;
    if (fonts?.primary) applyBrandFont(fonts.primary);
    // Optional: brands without a display face fall back to the primary one, which
    // is also what the generated --brand-font-display already resolves to.
    if (fonts?.display) applyBrandDisplayFont(fonts.display);
}

export function applyPrimaryColorFromConfig(): void {
    const color = brandConfig?.colors?.primary;
    if (color) applyPrimaryColor(color);
}
