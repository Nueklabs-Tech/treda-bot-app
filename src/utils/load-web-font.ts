// Families we are willing to pull from Google Fonts. The second group are display
// faces — geometric/technical sans suited to the wordmark and headline chrome
// rather than to body copy.
const SUPPORTED_FONTS = new Set([
    'Inter',
    'Roboto',
    'Poppins',
    'DM Sans',
    'Lato',
    'Nunito',
    'Open Sans',
    'Montserrat',
    'Raleway',
    'Source Sans 3',
    'Space Grotesk',
    'Sora',
    'Outfit',
    'Manrope',
    'Plus Jakarta Sans',
]);

const loaded = new Set<string>();

export function loadWebFont(family: string): void {
    if (!SUPPORTED_FONTS.has(family) || loaded.has(family)) return;
    loaded.add(family);

    const id = `webfont-${family.replace(/\s+/g, '-').toLowerCase()}`;
    if (document.getElementById(id)) return;

    const googleName = family.replace(/\s+/g, '+');
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${googleName}:wght@400;500;600;700&display=swap`;
    document.head.appendChild(link);
}

export function fontFamilyStack(family: string): string {
    if (!SUPPORTED_FONTS.has(family)) return family;
    return `'${family}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
}
