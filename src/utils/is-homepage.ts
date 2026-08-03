import { isPreviewMode, PREVIEW_BASE_PATH } from './is-preview-mode';

/**
 * True when the current URL is the app homepage — `/` on a standalone deploy,
 * or the router basename root (`/bot/preview`) in the App Builder preview build.
 *
 * The branded <AppLoading /> splash is reserved for this URL; every other route
 * (profile, the OAuth callback) shows the lightweight <CircleLoader /> instead,
 * so a chunk load inside the app does not look like a cold start.
 *
 * Reads `window.location` rather than the router so it also works above (and
 * before) <RouterProvider />.
 */
export const isHomepage = (pathname: string = window.location.pathname): boolean => {
    let path = pathname;

    if (isPreviewMode() && path.startsWith(PREVIEW_BASE_PATH)) {
        path = path.slice(PREVIEW_BASE_PATH.length);
    }

    // Strip trailing slashes so '/', '' and '/bot/preview/' all count as home.
    return path.replace(/\/+$/, '') === '';
};
