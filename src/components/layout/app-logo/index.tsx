import { getAppName } from '@/utils/branding';
import { localize } from '@deriv-com/translations';
// @ts-ignore
import './app-logo.scss';

export const AppLogo = () => {
    const appName = getAppName();

    return (
        <a href='/' className='app-header__logo' aria-label={localize('Home')}>
            <img className='app-header__logo-img' src='/assets/logo/badrobot.png' alt='' />
            <span className='app-header__logo-name'>{appName}</span>
        </a>
    );
};
