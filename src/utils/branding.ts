import brandConfig from '../../brand.config.json';

export const LOGO_CANDIDATES = ['/logo.png', '/logo.jpg', '/logo.jpeg', '/logo.webp'];

export function getAppName(): string {
    return (
        process.env.NEXT_PUBLIC_DERIV_APP_NAME ||
        brandConfig?.brand_name ||
        brandConfig?.platform?.name ||
        'TredaBot'
    );
}
