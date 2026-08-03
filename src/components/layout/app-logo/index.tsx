import { getAppName } from '@/utils/branding';
import { localize } from '@deriv-com/translations';
// @ts-ignore
import './app-logo.scss';

// The app name used to sit beside the logo here; the header account selector took
// that spot, so the mark is the logo alone and the name carries as the link's label.
export const AppLogo = () => (
    <a href='/' className='app-header__logo' aria-label={`${getAppName()} — ${localize('Home')}`}>
        <img className='app-header__logo-img' src='/assets/logo/badrobot.png' alt='' />
    </a>
);
