import { useCallback, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Navigate, useNavigate } from 'react-router-dom';
import { standalone_routes } from '@/components/shared/utils/routes/routes';
import ToggleSwitch from '@/components/shared_ui/toggle-switch';
import useActiveAccount from '@/hooks/api/account/useActiveAccount';
import { useApiBase } from '@/hooks/useApiBase';
import { useLogout } from '@/hooks/useLogout';
import { useStore } from '@/hooks/useStore';
import useThemeSwitcher from '@/hooks/useThemeSwitcher';
import { navigateToTransfer } from '@/utils/transfer-utils';
import { Localize, localize } from '@deriv-com/translations';
// @ts-ignore: Allow side-effect import of SCSS without type declarations
import './profile.scss';

/**
 * Outline glyphs for the list rows, in the same 24px / 1.6-stroke family so the
 * column of icons down the left edge reads as one set. `currentColor` keeps them
 * on the theme's text tokens — no colours of their own.
 */
const ICON_PATHS = {
    arrow_left: <path d='M15 19 8 12l7-7' />,
    chevron: <path d='m9 5 7 7-7 7' />,
    copy: (
        <>
            <rect x='9' y='9' width='11' height='11' rx='2.5' />
            <path d='M15 6V5.5A2.5 2.5 0 0 0 12.5 3h-7A2.5 2.5 0 0 0 3 5.5v7A2.5 2.5 0 0 0 5.5 15H6' />
        </>
    ),
    check: <path d='m5 12.5 4.5 4.5L19 7' />,
    wallet: (
        <>
            <rect x='3' y='6' width='18' height='13' rx='2.5' />
            <path d='M3 10h18M16.5 14.5h1' />
        </>
    ),
    coins: (
        <>
            <circle cx='12' cy='12' r='9' />
            <path d='M15 9h-3.75a1.75 1.75 0 0 0 0 3.5h1.5a1.75 1.75 0 0 1 0 3.5H9M12 7.5v9' />
        </>
    ),
    id_card: (
        <>
            <rect x='3' y='5' width='18' height='14' rx='2.5' />
            <circle cx='9' cy='11' r='2' />
            <path d='M6 16c.5-1.2 1.6-1.9 3-1.9s2.5.7 3 1.9M15 10.5h3M15 14h3' />
        </>
    ),
    globe: (
        <>
            <circle cx='12' cy='12' r='9' />
            <path d='M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18-2.6-2.7-2.6-15.3 0-18Z' />
        </>
    ),
    deposit: (
        <>
            <circle cx='12' cy='12' r='9' />
            <path d='M12 8v8M8 12h8' />
        </>
    ),
    transfer: <path d='M4 8.5h13l-3.5-3.5M20 15.5H7l3.5 3.5' />,
    statement: (
        <>
            <path d='M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z' />
            <path d='M14 3v5h5M9 13h6M9 17h4' />
        </>
    ),
    clock: (
        <>
            <circle cx='12' cy='12' r='9' />
            <path d='M12 7v5.2l3.2 1.9' />
        </>
    ),
    sliders: (
        <>
            <path d='M4 8h8M17 8h3M4 16h3M12 16h8' />
            <circle cx='14.5' cy='8' r='2.2' />
            <circle cx='9.5' cy='16' r='2.2' />
        </>
    ),
    moon: <path d='M20 13.6A8 8 0 1 1 10.4 4a6.6 6.6 0 0 0 9.6 9.6Z' />,
    help: (
        <>
            <circle cx='12' cy='12' r='9' />
            <path d='M9.6 9.6a2.5 2.5 0 1 1 3.3 2.4c-.6.2-1 .8-1 1.4v.3M12 17h.01' />
        </>
    ),
    shield: (
        <>
            <path d='M12 3.5 19 6.4v5c0 4.3-2.9 8.2-7 9.6-4.1-1.4-7-5.3-7-9.6v-5l7-2.9Z' />
            <path d='m9.2 12 2 2 3.6-3.6' />
        </>
    ),
    logout: <path d='M14 4h3.5A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5H14M10 8.5 6.5 12l3.5 3.5M6.5 12H16' />,
} as const;

type TIconName = keyof typeof ICON_PATHS;

const Icon = ({ name, className }: { name: TIconName; className?: string }) => (
    <svg
        width='22'
        height='22'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.6'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
        className={className}
    >
        {ICON_PATHS[name]}
    </svg>
);

const AvatarGlyph = () => (
    <svg width='60' height='60' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
        <circle cx='12' cy='8' r='4.2' />
        <path d='M12 13.6c-3.9 0-7 2.2-7 5.1 0 .7.6 1.3 1.4 1.3h11.2c.8 0 1.4-.6 1.4-1.3 0-2.9-3.1-5.1-7-5.1Z' />
    </svg>
);

type TLinkRow = {
    key: string;
    label: string;
    icon: TIconName;
    onClick: () => void;
    is_disabled?: boolean;
};

/** Long ids get the `019f....d7ad` treatment; a short loginid (CR1234567) stays whole. */
const maskLoginid = (loginid: string) =>
    loginid.length > 12 ? `${loginid.slice(0, 4)}....${loginid.slice(-4)}` : loginid;

const Profile = observer(() => {
    const navigate = useNavigate();
    const { activeLoginid, authData } = useApiBase();
    const { client } = useStore() ?? {};
    const { is_dark_mode_on, toggleTheme } = useThemeSwitcher();
    const handleLogout = useLogout();
    const [is_copied, setIsCopied] = useState(false);

    const { data: activeAccount } = useActiveAccount({
        allBalanceData: client?.all_accounts_balance,
        directBalance: client?.balance,
    });

    const handleTransfer = useCallback(() => {
        const transfer_currency = authData?.currency;
        if (!transfer_currency) return;
        navigateToTransfer(transfer_currency);
    }, [authData?.currency]);

    const openExternal = useCallback((url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    }, []);

    const copyLoginid = useCallback(() => {
        if (!activeLoginid) return;
        navigator.clipboard?.writeText(activeLoginid).then(
            () => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            },
            () => setIsCopied(false)
        );
    }, [activeLoginid]);

    const onLogout = useCallback(async () => {
        await handleLogout();
        navigate('/');
    }, [handleLogout, navigate]);

    const cashier_rows: TLinkRow[] = useMemo(
        () => [
            {
                key: 'deposit',
                label: localize('Deposit'),
                icon: 'deposit',
                onClick: () => openExternal(standalone_routes.cashier_deposit),
            },
            {
                key: 'transfer',
                label: localize('Transfer'),
                icon: 'transfer',
                onClick: handleTransfer,
                is_disabled: !authData?.currency || client?.is_logging_out,
            },
            {
                key: 'statement',
                label: localize('Statement'),
                icon: 'statement',
                onClick: () => openExternal(standalone_routes.statement),
            },
            {
                key: 'positions',
                label: localize('Positions'),
                icon: 'clock',
                onClick: () => openExternal(standalone_routes.positions),
            },
        ],
        [authData?.currency, client?.is_logging_out, handleTransfer, openExternal]
    );

    // "About you" mirrors the reference design; both destinations live on Deriv,
    // so they open externally rather than as routes of this app.
    const about_rows: TLinkRow[] = useMemo(
        () => [
            {
                key: 'personal',
                label: localize('Personal details'),
                icon: 'id_card',
                onClick: () => openExternal(standalone_routes.personal_details),
            },
            {
                key: 'settings',
                label: localize('Account settings'),
                icon: 'sliders',
                onClick: () => openExternal(standalone_routes.account_settings),
            },
        ],
        [openExternal]
    );

    const support_rows: TLinkRow[] = useMemo(
        () => [
            {
                key: 'help',
                label: localize('Help centre'),
                icon: 'help',
                onClick: () => openExternal(standalone_routes.help_center),
            },
            {
                key: 'responsible',
                label: localize('Responsible trading'),
                icon: 'shield',
                onClick: () => openExternal(standalone_routes.responsible),
            },
        ],
        [openExternal]
    );

    // The page is only reachable for a resolved session; a logged-out visitor
    // (direct URL, or a logout from this very page) belongs on the app root.
    if (!activeLoginid) return <Navigate to='/' replace />;

    const display_name = authData?.fullname?.trim() || authData?.email || localize('Trader');

    const renderLinkRows = (rows: TLinkRow[]) =>
        rows.map(row => (
            <li key={row.key}>
                <button type='button' className='profile__row' onClick={row.onClick} disabled={row.is_disabled}>
                    <Icon name={row.icon} className='profile__row-icon' />
                    <span className='profile__row-label'>{row.label}</span>
                    <Icon name='chevron' className='profile__chevron' />
                </button>
            </li>
        ));

    return (
        <div className='profile'>
            <header className='profile__hero'>
                <button
                    type='button'
                    className='profile__back'
                    onClick={() => navigate('/')}
                    aria-label={localize('Back to bot')}
                >
                    <Icon name='arrow_left' />
                </button>

                <div className='profile__avatar' aria-hidden='true'>
                    <AvatarGlyph />
                </div>

                <h1 className='profile__name'>{display_name}</h1>

                <button
                    type='button'
                    className='profile__id'
                    onClick={copyLoginid}
                    aria-label={localize('Copy account ID')}
                >
                    <span className='profile__id-value'>{maskLoginid(activeLoginid)}</span>
                    <Icon name={is_copied ? 'check' : 'copy'} className='profile__id-icon' />
                </button>
            </header>

            <div className='profile__sheet'>
                <section className='profile__group'>
                    <h2 className='profile__group-title'>
                        <Localize i18n_default_text='About you' />
                    </h2>
                    <ul className='profile__list'>{renderLinkRows(about_rows)}</ul>
                </section>

                <section className='profile__group'>
                    <h2 className='profile__group-title'>
                        <Localize i18n_default_text='Your account' />
                    </h2>
                    <ul className='profile__list'>
                        <li className='profile__row profile__row--static'>
                            <Icon name='wallet' className='profile__row-icon' />
                            <span className='profile__row-label'>
                                <Localize i18n_default_text='Balance' />
                            </span>
                            <span className='profile__row-value'>
                                {activeAccount?.balance ?? '0.00'} {activeAccount?.currency ?? ''}
                            </span>
                        </li>
                        <li className='profile__row profile__row--static'>
                            <Icon name='id_card' className='profile__row-icon' />
                            <span className='profile__row-label'>
                                <Localize i18n_default_text='Account type' />
                            </span>
                            <span
                                className={`profile__row-value profile__row-value--${
                                    activeAccount?.isVirtual ? 'demo' : 'real'
                                }`}
                            >
                                {activeAccount?.isVirtual ? (
                                    <Localize i18n_default_text='Demo' />
                                ) : (
                                    <Localize i18n_default_text='Real' />
                                )}
                            </span>
                        </li>
                        <li className='profile__row profile__row--static'>
                            <Icon name='coins' className='profile__row-icon' />
                            <span className='profile__row-label'>
                                <Localize i18n_default_text='Currency' />
                            </span>
                            <span className='profile__row-value'>{authData?.currency || '—'}</span>
                        </li>
                        {authData?.country && (
                            <li className='profile__row profile__row--static'>
                                <Icon name='globe' className='profile__row-icon' />
                                <span className='profile__row-label'>
                                    <Localize i18n_default_text='Residence' />
                                </span>
                                <span className='profile__row-value'>{authData.country.toUpperCase()}</span>
                            </li>
                        )}
                    </ul>
                </section>

                <section className='profile__group'>
                    <h2 className='profile__group-title'>
                        <Localize i18n_default_text='Cashier' />
                    </h2>
                    <ul className='profile__list'>{renderLinkRows(cashier_rows)}</ul>
                </section>

                <section className='profile__group'>
                    <h2 className='profile__group-title'>
                        <Localize i18n_default_text='Preferences' />
                    </h2>
                    <ul className='profile__list'>
                        <li className='profile__row profile__row--static'>
                            <Icon name='moon' className='profile__row-icon' />
                            <span className='profile__row-label'>
                                <Localize i18n_default_text='Dark mode' />
                            </span>
                            <ToggleSwitch
                                id='profile-dark-mode'
                                handleToggle={toggleTheme}
                                is_enabled={is_dark_mode_on}
                                classNameLabel='profile__toggle'
                            />
                        </li>
                    </ul>
                </section>

                <section className='profile__group'>
                    <h2 className='profile__group-title'>
                        <Localize i18n_default_text='Support' />
                    </h2>
                    <ul className='profile__list'>{renderLinkRows(support_rows)}</ul>
                </section>

                <button type='button' className='profile__logout' onClick={onLogout} disabled={client?.is_logging_out}>
                    <Icon name='logout' className='profile__logout-icon' />
                    <Localize i18n_default_text='Log out' />
                </button>
            </div>
        </div>
    );
});

export default Profile;
