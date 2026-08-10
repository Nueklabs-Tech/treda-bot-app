import { useEffect, useState } from 'react';
import { TApiError, subscribeToStream } from '@/utils/api-subscription';

/** One point of a contract's tick-by-tick price path, as returned in `audit_details`. */
export type TContractTick = {
    epoch?: number;
    tick?: number | null;
    tick_display_value?: string | null;
    flag?: string | null;
    name?: string | null;
};

export type TOpenContract = {
    contract_id: number;
    contract_type: string;
    display_name?: string;
    underlying?: string;
    longcode?: string;
    buy_price: number;
    bid_price?: number;
    payout?: number;
    profit?: number;
    currency: string;
    status?: 'open' | 'won' | 'lost' | 'sold';
    is_sold?: 0 | 1;
    barrier?: string;
    date_start?: number;
    date_expiry?: number;
    sell_time?: number | null;
    entry_spot?: number | null;
    entry_spot_display_value?: string;
    entry_tick_time?: number;
    exit_tick?: number;
    exit_tick_display_value?: string;
    exit_tick_time?: number;
    current_spot_display_value?: string;
    tick_count?: number;
    tick_stream?: { epoch: number; tick: number }[];
    transaction_ids?: { buy?: number; sell?: number };
    /** Present once the contract has ended — the full tick path used to draw its chart. */
    audit_details?: { all_ticks?: TContractTick[] } | null;
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
