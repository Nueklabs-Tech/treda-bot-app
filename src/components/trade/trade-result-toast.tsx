import clsx from 'clsx';
import { toast } from 'react-toastify';
import { addComma, getCurrencyDisplayCode, getDecimalPlaces } from '@/components/shared';
import { Localize } from '@deriv-com/translations';

type TTradeResultToastParams = {
    profit: number;
    currency: string;
    side_label: string;
    symbol_label: string;
};

const formatMoney = (amount: number, currency: string) =>
    addComma(Number(amount || 0).toFixed(getDecimalPlaces(currency || 'USD')));

/**
 * The result banner for a manually-bought contract, shown once it settles.
 *
 * Mirrors the ticket's own win/loss tone (see active-contract.tsx) but as a
 * toast, since a settlement can land while the user has scrolled the chart or
 * switched symbols away from the ticket.
 */
const TradeResultToastContent = ({ profit, currency, side_label, symbol_label }: TTradeResultToastParams) => {
    const is_win = profit >= 0;
    const amount = `${is_win ? '+' : '-'}${formatMoney(Math.abs(profit), currency)} ${getCurrencyDisplayCode(currency)}`;

    return (
        <div className={clsx('trade-result-toast', `trade-result-toast--${is_win ? 'win' : 'loss'}`)}>
            <span className='trade-result-toast__icon' aria-hidden='true'>
                {is_win ? (
                    <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
                        <path
                            d='M5 12l5 5L20 7'
                            stroke='currentColor'
                            strokeWidth='2.5'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                    </svg>
                ) : (
                    <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
                        <path
                            d='M6 6l12 12M18 6 6 18'
                            stroke='currentColor'
                            strokeWidth='2.5'
                            strokeLinecap='round'
                        />
                    </svg>
                )}
            </span>
            <span className='trade-result-toast__text'>
                <span className='trade-result-toast__title'>
                    {is_win ? (
                        <Localize i18n_default_text='Profit: {{amount}}' values={{ amount }} />
                    ) : (
                        <Localize i18n_default_text='Loss: {{amount}}' values={{ amount }} />
                    )}
                </span>
                <span className='trade-result-toast__subtitle'>
                    {side_label} - {symbol_label}
                </span>
            </span>
        </div>
    );
};

/** Fires the settlement toast for a bought contract. Call once per contract_id. */
export const showTradeResultToast = (params: TTradeResultToastParams) => {
    toast(<TradeResultToastContent {...params} />, {
        position: toast.POSITION.TOP_CENTER,
        autoClose: 4000,
        hideProgressBar: true,
        closeButton: false,
        closeOnClick: true,
        className: 'trade-result-toast-toast',
    });
};
