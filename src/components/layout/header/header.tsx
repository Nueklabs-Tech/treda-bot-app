import { useCallback, useState } from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { generateOAuthURL } from '@/components/shared';
import Button from '@/components/shared_ui/button';
import useActiveAccount from '@/hooks/api/account/useActiveAccount';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import { navigateToTransfer } from '@/utils/transfer-utils';
import { Localize } from '@deriv-com/translations';
import { Header, useDevice, Wrapper } from '@deriv-com/ui';
import { AppLogo } from '../app-logo';
import AccountSwitcher from './account-switcher';
import { TransferIcon } from './auth-icons';
import MenuItems from './menu-items';
import MobileMenu from './mobile-menu';
// @ts-ignore: Allow side-effect import of SCSS without type declarations
import './header.scss';
import { useLogout } from '@/hooks/useLogout';

// The session is fully resolved by AuthBootstrapGate before this component ever
// mounts (see @/services/auth-bootstrap), so `activeLoginid` is authoritative
// here: there is no in-between state left to render a spinner for.
const AppHeader = observer(() => {
    const { isDesktop } = useDevice();
    const { activeLoginid, setIsAuthorizing, authData } = useApiBase();
    const { client } = useStore() ?? {};
    // Tracks the OAuth URL round-trip so both auth buttons stay disabled while
    // one of them is redirecting.
    const [isRedirecting, setIsRedirecting] = useState(false);

    const { data: activeAccount } = useActiveAccount({
        allBalanceData: client?.all_accounts_balance,
        directBalance: client?.balance,
    });

    const handleLogout = useLogout();

    const handleSignup = useCallback(async () => {
        try {
            setIsRedirecting(true);
            setIsAuthorizing(true);
            const oauthUrl = await generateOAuthURL('registration');
            if (oauthUrl) {
                window.location.replace(oauthUrl);
            } else {
                console.error('Failed to generate OAuth URL for signup');
                setIsAuthorizing(false);
                setIsRedirecting(false);
            }
        } catch (error) {
            console.error('Signup redirection failed:', error);
            setIsAuthorizing(false);
            setIsRedirecting(false);
        }
    }, [setIsAuthorizing]);

    const handleLogin = useCallback(async () => {
        try {
            setIsRedirecting(true);
            setIsAuthorizing(true);

            const oauthUrl = await generateOAuthURL();
            if (oauthUrl) {
                window.location.replace(oauthUrl);
            } else {
                console.error('Failed to generate OAuth URL');
                setIsAuthorizing(false);
                setIsRedirecting(false);
            }
        } catch (error) {
            console.error('Login redirection failed:', error);
            // Reset authorizing state if redirection fails
            setIsAuthorizing(false);
            setIsRedirecting(false);
        }
    }, [setIsAuthorizing]);

    const handleTransfer = useCallback(() => {
        const transferCurrency = authData?.currency;
        if (!transferCurrency) {
            console.error('No currency available for transfer');
            return;
        }
        navigateToTransfer(transferCurrency);
    }, [authData?.currency]);

    const renderAccountSection = useCallback(
        (position: 'left' | 'right' = 'right') => {
            // Authenticated: account switcher (and transfer on the right).
            if (activeLoginid) {
                if (position === 'left' && !isDesktop) {
                    // For mobile left section - only account switcher
                    return (
                        <div className='auth-actions'>
                            <div className='account-info'>
                                <AccountSwitcher activeAccount={activeAccount} />
                            </div>
                        </div>
                    );
                } else if (position === 'right') {
                    // For right section - transfer button (and account switcher on desktop)
                    return (
                        <div className='auth-actions'>
                            {isDesktop && (
                                <div className='account-info'>
                                    <AccountSwitcher activeAccount={activeAccount} />
                                </div>
                            )}
                            <Button
                                primary
                                type='button'
                                icon={<TransferIcon />}
                                className='auth-actions__btn auth-actions__btn--cta'
                                disabled={client?.is_logging_out || !authData?.currency}
                                onClick={handleTransfer}
                            >
                                <Localize i18n_default_text='Transfer' />
                            </Button>
                        </div>
                    );
                }
            }
            // Logged out: the session is already settled, so this is final.
            else if (position === 'right') {
                const isAuthConfigured = Boolean(process.env.NEXT_PUBLIC_DERIV_APP_ID);

                return (
                    <div className='auth-actions'>
                        <Button
                            tertiary
                            type='button'
                            className='auth-actions__btn auth-actions__btn--ghost'
                            disabled={!isAuthConfigured || isRedirecting}
                            onClick={handleLogin}
                        >
                            <Localize i18n_default_text='Log in' />
                        </Button>
                        <Button
                            primary_light
                            type='button'
                            className='auth-actions__btn auth-actions__btn--cta'
                            disabled={!isAuthConfigured || isRedirecting}
                            onClick={handleSignup}
                        >
                            <Localize i18n_default_text='Get Started' />
                        </Button>
                    </div>
                );
            }

            return null;
        },
        [
            isDesktop,
            activeLoginid,
            client,
            activeAccount,
            authData,
            isRedirecting,
            handleLogin,
            handleSignup,
            handleTransfer,
        ]
    );

    if (client?.should_hide_header) return null;

    return (
        <>
            <Header
                className={clsx('app-header', {
                    'app-header--desktop': isDesktop,
                    'app-header--mobile': !isDesktop,
                })}
            >
                <Wrapper variant='left'>
                    <AppLogo />
                    {isDesktop ? <MenuItems /> : renderAccountSection('left')}
                </Wrapper>
                <Wrapper variant='right'>{renderAccountSection('right')}</Wrapper>
            </Header>
        </>
    );
});

export default AppHeader;
