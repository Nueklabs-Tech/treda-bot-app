import { ReactNode } from 'react';
import clsx from 'clsx';
import BottomSheet from '@/components/bottom-sheet';
import { Localize, localize } from '@deriv-com/translations';

export type TSheetAccount = {
    loginid: string;
    currency: string;
    balance: string;
    is_virtual: boolean;
    is_active: boolean;
};

type TAccountSheetProps = {
    is_open: boolean;
    onClose: () => void;
    onSelect: (loginid: string) => void;
    accounts: TSheetAccount[];
    /** Set while a bot run is in flight — switching mid-run would orphan the contracts. */
    is_locked?: boolean;
};

const CheckIcon = () => (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden='true'>
        <path
            d='m3.5 8.4 3 3 6-6.4'
            stroke='currentColor'
            strokeWidth='1.8'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
);

const AccountRow = ({
    account,
    onSelect,
    is_locked,
}: {
    account: TSheetAccount;
    onSelect: (loginid: string) => void;
    is_locked?: boolean;
}) => (
    <li>
        {/* Plain buttons rather than listbox/option roles: `option` has to be a
            direct child of the listbox, which the list item breaks. */}
        <button
            type='button'
            aria-current={account.is_active ? 'true' : undefined}
            disabled={is_locked && !account.is_active}
            className={clsx('account-sheet__row', {
                'account-sheet__row--active': account.is_active,
            })}
            onClick={() => onSelect(account.loginid)}
        >
            <span
                className={clsx('account-sheet__badge', {
                    'account-sheet__badge--virtual': account.is_virtual,
                })}
                aria-hidden='true'
            >
                {account.is_virtual ? localize('D') : account.currency.slice(0, 3)}
            </span>
            <span className='account-sheet__details'>
                <span className='account-sheet__type'>
                    {account.is_virtual ? (
                        <Localize i18n_default_text='Demo account' />
                    ) : (
                        <Localize i18n_default_text='Real account' />
                    )}
                </span>
                <span className='account-sheet__loginid'>{account.loginid}</span>
            </span>
            <span className='account-sheet__balance'>
                {account.currency ? (
                    `${account.balance} ${account.currency}`
                ) : (
                    <Localize i18n_default_text='No currency assigned' />
                )}
            </span>
            {account.is_active && (
                <span className='account-sheet__check'>
                    <CheckIcon />
                </span>
            )}
        </button>
    </li>
);

const AccountGroup = ({
    label,
    accounts,
    onSelect,
    is_locked,
}: {
    label: ReactNode;
    accounts: TSheetAccount[];
    onSelect: (loginid: string) => void;
    is_locked?: boolean;
}) => {
    if (accounts.length === 0) return null;

    return (
        <>
            <p className='account-sheet__group'>{label}</p>
            <ul className='account-sheet__list'>
                {accounts.map(account => (
                    <AccountRow key={account.loginid} account={account} onSelect={onSelect} is_locked={is_locked} />
                ))}
            </ul>
        </>
    );
};

/** Account picker — the app's bottom sheet with the real/demo account list in it. */
const AccountSheet = ({ is_open, onClose, onSelect, accounts, is_locked }: TAccountSheetProps) => (
    <BottomSheet
        is_open={is_open}
        onClose={onClose}
        className='account-sheet'
        title={<Localize i18n_default_text='Select account' />}
        aria_label={localize('Select account')}
    >
        {is_locked && (
            <p className='account-sheet__notice'>
                <Localize i18n_default_text='Stop the bot before switching accounts.' />
            </p>
        )}

        <AccountGroup
            label={<Localize i18n_default_text='Real' />}
            accounts={accounts.filter(account => !account.is_virtual)}
            onSelect={onSelect}
            is_locked={is_locked}
        />
        <AccountGroup
            label={<Localize i18n_default_text='Demo' />}
            accounts={accounts.filter(account => account.is_virtual)}
            onSelect={onSelect}
            is_locked={is_locked}
        />
    </BottomSheet>
);

export default AccountSheet;
