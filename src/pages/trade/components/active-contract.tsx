import clsx from 'clsx';
import { addComma, getCurrencyDisplayCode, getDecimalPlaces } from '@/components/shared';
import { TOpenContract } from '@/hooks/useOpenContract';
import { Localize, localize } from '@deriv-com/translations';

type TActiveContractProps = {
    contract: TOpenContract | null;
    currency: string;
    onDismiss: () => void;
};

const formatMoney = (amount: number, currency: string) =>
    addComma(Number(amount || 0).toFixed(getDecimalPlaces(currency || 'USD')));

/**
 * The contract the user just bought, followed until it settles.
 *
 * Without this the buy button is a black hole — the trade is placed and nothing
 * on screen changes. It stays until dismissed, so a settled result is not lost
 * to a glance away from the screen.
 */
const ActiveContract = ({ contract, currency, onDismiss }: TActiveContractProps) => {
    if (!contract) {
        return (
            <div className='active-contract active-contract--pending'>
                <span className='active-contract__title'>
                    <Localize i18n_default_text='Placing your trade…' />
                </span>
            </div>
        );
    }

    const profit = Number(contract.profit ?? 0);
    const is_settled = Boolean(contract.is_sold);
    const tone = is_settled ? (profit >= 0 ? 'win' : 'loss') : 'open';

    return (
        <div className={clsx('active-contract', `active-contract--${tone}`)}>
            <div className='active-contract__text'>
                <span className='active-contract__title'>
                    {contract.display_name || contract.contract_type}
                    {is_settled ? (
                        profit >= 0 ? (
                            <Localize i18n_default_text=' · Won' />
                        ) : (
                            <Localize i18n_default_text=' · Lost' />
                        )
                    ) : (
                        <Localize i18n_default_text=' · Running' />
                    )}
                </span>
                <span className='active-contract__meta'>
                    <Localize
                        i18n_default_text='Stake {{stake}} {{currency}}'
                        values={{
                            stake: formatMoney(contract.buy_price, currency),
                            currency: getCurrencyDisplayCode(currency),
                        }}
                    />
                    {contract.current_spot_display_value && ` · ${contract.current_spot_display_value}`}
                </span>
            </div>

            <span
                className={clsx('active-contract__profit', `active-contract__profit--${profit >= 0 ? 'win' : 'loss'}`)}
            >
                {profit >= 0 ? '+' : '-'}
                {formatMoney(Math.abs(profit), currency)}
            </span>

            <button
                type='button'
                className='active-contract__dismiss'
                onClick={onDismiss}
                aria-label={localize('Dismiss')}
            >
                <svg width='16' height='16' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
                    <path d='M6 6l12 12M18 6 6 18' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
                </svg>
            </button>
        </div>
    );
};

export default ActiveContract;
