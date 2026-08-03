import { useEffect, useState } from 'react';
import { TApiError, subscribeToStream } from '@/utils/api-subscription';

export type TOpenContract = {
    contract_id: number;
    contract_type: string;
    display_name?: string;
    longcode?: string;
    buy_price: number;
    bid_price?: number;
    payout?: number;
    profit?: number;
    currency: string;
    status?: 'open' | 'won' | 'lost' | 'sold';
    is_sold?: 0 | 1;
    entry_spot_display_value?: string;
    current_spot_display_value?: string;
    tick_count?: number;
    tick_stream?: { epoch: number; tick: number }[];
    date_expiry?: number;
};

/**
 * Follows one bought contract from purchase to settlement.
 *
 * The buy response only says the contract exists; everything the user wants to
 * see afterwards — the running profit, the ticks left, whether it won — arrives
 * on this subscription, which the API closes itself once the contract is sold.
 */
export const useOpenContract = (contract_id: number | null) => {
    const [contract, setContract] = useState<TOpenContract | null>(null);
    const [error, setError] = useState<TApiError | null>(null);

    useEffect(() => {
        if (!contract_id) {
            setContract(null);
            setError(null);

            return;
        }

        setContract(null);
        setError(null);

        return subscribeToStream<TOpenContract>({
            request: { proposal_open_contract: 1, contract_id },
            msg_type: 'proposal_open_contract',
            onData: setContract,
            onError: setError,
        });
    }, [contract_id]);

    return { contract, error };
};

export default useOpenContract;
