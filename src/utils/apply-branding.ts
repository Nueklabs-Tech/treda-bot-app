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
