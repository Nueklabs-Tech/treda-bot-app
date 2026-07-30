import { localize } from '@deriv-com/translations';
import { LogoMark } from './LogoMark';
// @ts-ignore
import './app-logo.scss';

export const AppLogo = () => {
    return (
        <a href='/' className='app-header__logo' aria-label={localize('Home')}>
            {/* <LogoMark height={32} /> */}H
        </a>
    );
};
