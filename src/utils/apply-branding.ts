import { fontFamilyStack, loadWebFont } from './load-web-font';

export function applyPrimaryColor(color: string): void {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', color);
    root.style.setProperty('--brand-red-coral', color);
}

export function applyBrandFont(family: string): void {
    loadWebFont(family);
    document.documentElement.style.setProperty('--brand-font-primary', fontFamilyStack(family));
}

// The wordmark/headline face. Kept separate from the body font so the logo can
// carry a display typeface without restyling every paragraph in the app.
export function applyBrandDisplayFont(family: string): void {
    loadWebFont(family);
    document.documentElement.style.setProperty('--brand-font-display', fontFamilyStack(family));
}
