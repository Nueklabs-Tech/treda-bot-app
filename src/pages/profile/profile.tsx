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

const ChevronIcon = () => (
    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' aria-hidden='true' className='profile__chevron'>
        <path d='m9 5 7 7-7 7' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
);

type TQuickAction = {
    key: string;
    label: string;
    emoji: string;
    onClick: () => void;
    is_disabled?: boolean;
};

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

    const quick_actions: TQuickAction[] = useMemo(
        () => [
            {
                key: 'transfer',
                label: localize('Transfer'),
                emoji: '⇄',
                onClick: handleTransfer,
                is_disabled: !authData?.currency || client?.is_logging_out,
            },
            {
                key: 'deposit',
                label: localize('Deposit'),
                emoji: '＋',
                onClick: () => openExternal(standalone_routes.cashier_deposit),
            },
            {
                key: 'statement',
                label: localize('Statement'),
                emoji: '≡',
                onClick: () => openExternal(standalone_routes.statement),
            },
            {
                key: 'positions',
                label: localize('Positions'),
                emoji: '◷',
                onClick: () => openExternal(standalone_routes.positions),
            },
        ],
        [authData?.currency, client?.is_logging_out, handleTransfer, openExternal]
    );

    // The page is only reachable for a resolved session; a logged-out visitor
    // (direct URL, or a logout from this very page) belongs on the app root.
    if (!activeLoginid) return <Navigate to='/' replace />;

    const display_name = authData?.fullname?.trim() || authData?.email || localize('Trader');

    return (
        <div className='profile'>
            <div className='profile__inner'>
                <section className='profile__hero'>
                    <div className='profile__avatar' aria-hidden='true'>
                        {display_name.charAt(0).toUpperCase()}
                    </div>
                    <h1 className='profile__name'>{display_name}</h1>
                    {authData?.email && <p className='profile__email'>{authData.email}</p>}
                    <span className={`profile__badge profile__badge--${activeAccount?.isVirtual ? 'demo' : 'real'}`}>
                        {activeAccount?.isVirtual ? (
                            <Localize i18n_default_text='Demo account' />
                        ) : (
                            <Localize i18n_default_text='Real account' />
                        )}
                    </span>

                    <div className='profile__balance'>
                        <span className='profile__balance-label'>
                            <Localize i18n_default_text='Balance' />
                        </span>
                        <span className='profile__balance-value'>
                            {activeAccount?.balance ?? '0.00'} {activeAccount?.currency ?? ''}
                        </span>
                    </div>
                </section>

                <section className='profile__actions' aria-label={localize('Quick actions')}>
                    {quick_actions.map(action => (
                        <button
                            key={action.key}
                            type='button'
                            className='profile__action'
                            onClick={action.onClick}
                            disabled={action.is_disabled}
                        >
                            <span className='profile__action-icon' aria-hidden='true'>
                                {action.emoji}
                            </span>
                            <span className='profile__action-label'>{action.label}</span>
                        </button>
                    ))}
                </section>

                <section className='profile__group'>
                    <h2 className='profile__group-title'>
                        <Localize i18n_default_text='Account' />
                    </h2>
                    <ul className='profile__list'>
                        <li className='profile__row'>
                            <span className='profile__row-label'>
                                <Localize i18n_default_text='Account ID' />
                            </span>
                            <button type='button' className='profile__row-action' onClick={copyLoginid}>
                                <span className='profile__row-value'>{activeLoginid}</span>
                                <span className='profile__copy'>
                                    {is_copied ? (
                                        <Localize i18n_default_text='Copied' />
                                    ) : (
                                        <Localize i18n_default_text='Copy' />
                                    )}
                                </span>
                            </button>
                        </li>
                        <li className='profile__row'>
                            <span className='profile__row-label'>
                                <Localize i18n_default_text='Currency' />
                            </span>
                            <span className='profile__row-value'>{authData?.currency || '—'}</span>
                        </li>
                        {authData?.country && (
                            <li className='profile__row'>
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
                        <Localize i18n_default_text='Preferences' />
                    </h2>
                    <ul className='profile__list'>
                        <li className='profile__row'>
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
                        <Localize i18n_default_text='More' />
                    </h2>
                    <ul className='profile__list'>
                        <li>
                            <button
                                type='button'
                                className='profile__link'
                                onClick={() => openExternal(standalone_routes.account_settings)}
                            >
                                <span>
                                    <Localize i18n_default_text='Account settings' />
                                </span>
                                <ChevronIcon />
                            </button>
                        </li>
                        <li>
                            <button
                                type='button'
                                className='profile__link'
                                onClick={() => openExternal(standalone_routes.help_center)}
                            >
                                <span>
                                    <Localize i18n_default_text='Help centre' />
                                </span>
                                <ChevronIcon />
                            </button>
                        </li>
                        <li>
                            <button
                                type='button'
                                className='profile__link'
                                onClick={() => openExternal(standalone_routes.responsible)}
                            >
                                <span>
                                    <Localize i18n_default_text='Responsible trading' />
                                </span>
                                <ChevronIcon />
                            </button>
                        </li>
                    </ul>
                </section>

                <button type='button' className='profile__logout' onClick={onLogout} disabled={client?.is_logging_out}>
                    <Localize i18n_default_text='Log out' />
                </button>

                <button type='button' className='profile__back' onClick={() => navigate('/')}>
                    <Localize i18n_default_text='Back to bot' />
                </button>
            </div>
        </div>
    );
});

export default Profile;
