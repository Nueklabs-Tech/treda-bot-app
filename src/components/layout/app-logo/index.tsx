import { localize } from '@deriv-com/translations';
// @ts-ignore
import './app-logo.scss';

export const AppLogo = () => {
    return (
        <a href='/' className='app-header__logo' aria-label={localize('Home')}>
            <img src='/assets/logo/badrobot.png' alt='' />
        </a>
    );
};
