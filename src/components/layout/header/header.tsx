import { useCallback, useState } from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateOAuthURL } from '@/components/shared';
import Button from '@/components/shared_ui/button';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import { Localize, localize } from '@deriv-com/translations';
import { Header, useDevice, Wrapper } from '@deriv-com/ui';
import { AppLogo } from '../app-logo';
import PrimaryNav from '../primary-nav';
import { NotificationIcon, ProfileIcon } from './auth-icons';
import MenuItems from './menu-items';
import NotificationsPanel, { useNotifications } from './notifications-panel';
// @ts-ignore: Allow side-effect import of SCSS without type declarations
import './header.scss';

// The session is fully resolved by AuthBootstrapGate before this component ever
// mounts (see @/services/auth-bootstrap), so `activeLoginid` is authoritative
// here: there is no in-between state left to render a spinner for.
const AppHeader = observer(() => {
    const { isDesktop } = useDevice();
    const { activeLoginid, setIsAuthorizing } = useApiBase();
    const { client } = useStore() ?? {};
    const navigate = useNavigate();
    const { pathname } = useLocation();
    // Tracks the OAuth URL round-trip so both auth buttons stay disabled while
    // one of them is redirecting.
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const { unread_count } = useNotifications();

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

    // The profile icon is a route, not a menu: tapping it opens the full profile
    // page (and tapping it again from there goes back to the bot).
    const handleProfile = useCallback(() => {
        setIsNotificationsOpen(false);
        navigate(pathname === '/profile' ? '/' : '/profile');
    }, [navigate, pathname]);

    const toggleNotifications = useCallback(() => setIsNotificationsOpen(open => !open), []);

    const closeNotifications = useCallback(() => setIsNotificationsOpen(false), []);

    // Only the right-hand wrapper carries account UI; the left one is the logo and
    // navigation. Account switching lives on the profile page, so what is left
    // here is notifications + profile when signed in, and the auth CTAs when not.
    const renderAccountSection = useCallback(() => {
        if (activeLoginid) {
            return (
                <div className='auth-actions'>
                    <div className='header-actions'>
                        <button
                            type='button'
                            className={clsx('header-actions__btn', {
                                'header-actions__btn--active': isNotificationsOpen,
                            })}
                            onClick={toggleNotifications}
                            aria-label={localize('Notifications')}
                            aria-expanded={isNotificationsOpen}
                        >
                            <NotificationIcon />
                            {unread_count > 0 && (
                                <span className='header-actions__badge' aria-hidden='true'>
                                    {unread_count > 9 ? '9+' : unread_count}
                                </span>
                            )}
                        </button>

                        <button
                            type='button'
                            className={clsx('header-actions__btn', {
                                'header-actions__btn--active': pathname === '/profile',
                            })}
                            onClick={handleProfile}
                            aria-label={localize('Profile')}
                            aria-current={pathname === '/profile' ? 'page' : undefined}
                        >
                            <ProfileIcon />
                        </button>
                    </div>
                </div>
            );
        }

        // Logged out: the session is already settled, so this is final.
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
    }, [
        activeLoginid,
        isRedirecting,
        isNotificationsOpen,
        unread_count,
        pathname,
        handleLogin,
        handleSignup,
        handleProfile,
        toggleNotifications,
    ]);

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
                    <PrimaryNav />
                    {isDesktop && <MenuItems />}
                </Wrapper>
                <Wrapper variant='right'>{renderAccountSection()}</Wrapper>
            </Header>
            {activeLoginid && <NotificationsPanel is_open={isNotificationsOpen} onClose={closeNotifications} />}
        </>
    );
});

export default AppHeader;
