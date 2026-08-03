import { useEffect, useState } from 'react';
import { CONNECTION_STATUS } from '@/external/bot-skeleton/services/api/observables/connection-status-stream';
import { TApiError, subscribeToStream } from '@/utils/api-subscription';
import { useApiBase } from './useApiBase';

export type TProposalRequest = {
    symbol: string;
    contract_type: string;
    /** Stake, in the account's currency. */
    amount: number;
    currency: string;
    duration: number;
    duration_unit: string;
    /** Digit for digit contracts, price offset for higher/lower. */
    barrier?: string;
};

export type TProposal = {
    id: string;
    ask_price: number;
    payout: number;
    display_value: string;
    spot?: number;
    longcode?: string;
};

export type TProposalState = {
    proposal: TProposal | null;
    error: TApiError | null;
    is_loading: boolean;
};

/** Typing in the stake field would otherwise open a subscription per keystroke. */
const DEBOUNCE_MS = 350;

/**
 * Live price for one contract — the payout and ask price the Buy button quotes,
 * kept current by a `proposal` subscription that is torn down and reopened
 * whenever a parameter changes.
 *
 * A rejected proposal is a normal state, not a failure: an out-of-range stake or
 * duration comes back as an error the panel shows in place of the payout, which
 * is how the user finds out what the contract actually allows.
 */
export const useProposal = (request: TProposalRequest | null): TProposalState => {
    const { connectionStatus } = useApiBase();
    const [state, setState] = useState<TProposalState>({ proposal: null, error: null, is_loading: false });

    // Effects compare deps by identity, and the caller rebuilds the request object
    // every render; the serialised form is what actually changed.
    const request_key = request ? JSON.stringify(request) : '';
    const is_connected = connectionStatus === CONNECTION_STATUS.OPENED;

    useEffect(() => {
        if (!request_key || !is_connected) {
            setState({ proposal: null, error: null, is_loading: false });

            return;
        }

        setState(previous => ({ ...previous, is_loading: true }));

        const { symbol, contract_type, amount, currency, duration, duration_unit, barrier } = JSON.parse(
            request_key
        ) as TProposalRequest;

        let unsubscribe: (() => void) | null = null;

        const timer = setTimeout(() => {
            unsubscribe = subscribeToStream<TProposal>({
                request: {
                    proposal: 1,
                    amount,
                    basis: 'stake',
                    contract_type,
                    currency,
                    duration,
                    duration_unit,
                    symbol,
                    ...(barrier ? { barrier } : {}),
                },
                msg_type: 'proposal',
                onData: proposal => setState({ proposal, error: null, is_loading: false }),
                onError: error => setState({ proposal: null, error, is_loading: false }),
            });
        }, DEBOUNCE_MS);

        return () => {
            clearTimeout(timer);
            unsubscribe?.();
        };
    }, [request_key, is_connected]);

    return state;
};

export default useProposal;
