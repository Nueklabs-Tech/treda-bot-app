/**
 * The theme CSS variables in `components/shared/styles/_themes.scss` only resolve
 * inside `.theme--light` / `.theme--dark`, so the class has to be on <body> before
 * anything themed renders — including the loader and the error screens, which are
 * shown before (or instead of) the app content.
 */
export const applyThemeClass = (is_dark_mode_on: boolean) => {
    const body = document.querySelector('body');
    if (!body) return;

    body.classList.remove('theme--light', 'theme--dark');
    body.classList.add(is_dark_mode_on ? 'theme--dark' : 'theme--light');
};
