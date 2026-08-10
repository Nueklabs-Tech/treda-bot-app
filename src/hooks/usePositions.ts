import { useEffect, useMemo, useRef, useState } from 'react';
import { showTradeResultToast } from '@/components/trade/trade-result-toast';
import { getSideLabel } from '@/constants/trade';
import { api_base } from '@/external/bot-skeleton';
import { getSymbolCode, TActiveSymbol } from '@/pages/trade/types';
import { subscribeToStream } from '@/utils/api-subscription';
import { useApiBase } from './useApiBase';

export type TPosition = {
    contract_id: number;
    symbol: string;
    display_name: string;
    contract_type: string;
    side_label: string;
    buy_price: number;
    payout: number;
    profit: number;
    currency: string;
    date_start?: number;
    date_expiry?: number;
    sell_time?: number | null;
    tick_count?: number;
    is_sold: boolean;
};

/** The subset of a `proposal_open_contract` payload this screen reads. */
type TRawOpenContract = {
    contract_id?: number;
    underlying?: string;
    display_name?: string;
    contract_type?: string;
    buy_price?: number;
    payout?: number;
    profit?: number;
    currency?: string;
    date_start?: number;
    date_expiry?: number;
    sell_time?: number | null;
    tick_count?: number;
    is_sold?: 0 | 1;
};

/** The subset of a `profit_table` row this screen reads (fetched with `description: 1`). */
type TRawProfitTableRow = {
    contract_id?: number | null;
    underlying_symbol?: string;
    contract_type?: string;
    buy_price?: number;
    payout?: number;
    sell_price?: number;
    purchase_time?: number;
    sell_time?: number | null;
};

const toPositionFromOpenContract = (raw: TRawOpenContract, symbol_names: Record<string, string>): TPosition => ({
    contract_id: Number(raw.contract_id),
    symbol: raw.underlying ?? '',
    display_name: raw.display_name || symbol_names[raw.underlying ?? ''] || raw.underlying || '',
    contract_type: raw.contract_type ?? '',
    side_label: getSideLabel(raw.contract_type),
    buy_price: Number(raw.buy_price) || 0,
    payout: Number(raw.payout) || 0,
    profit: Number(raw.profit) || 0,
    currency: raw.currency ?? '',
    date_start: raw.date_start,
    date_expiry: raw.date_expiry,
    sell_time: raw.sell_time ?? null,
    tick_count: raw.tick_count,
    is_sold: Boolean(raw.is_sold),
});

const toPositionFromProfitTableRow = (
    raw: TRawProfitTableRow,
    symbol_names: Record<string, string>,
    currency: string
): TPosition => ({
    contract_id: Number(raw.contract_id),
    symbol: raw.underlying_symbol ?? '',
    display_name: symbol_names[raw.underlying_symbol ?? ''] || raw.underlying_symbol || '',
    contract_type: raw.contract_type ?? '',
    side_label: getSideLabel(raw.contract_type),
    buy_price: Number(raw.buy_price) || 0,
    payout: Number(raw.payout) || 0,
    profit: Number(raw.sell_price ?? 0) - Number(raw.buy_price ?? 0),
    currency,
    date_start: raw.purchase_time,
    sell_time: raw.sell_time ?? null,
    is_sold: true,
});

/**
 * Every contract on the account — manual trades from the Trade screen and bot
 * runs alike, since both are just contracts bought on the same login. Backed
 * directly by the Deriv API rather than any app-side record of what was bought:
 * `portfolio` seeds the open list, `profit_table` seeds closed history, and a
 * contract-id-less `proposal_open_contract` subscription streams both live
 * updates and settlements for as long as this is mounted.
 */
export const usePositions = (currency: string) => {
    const { isAuthorized } = useApiBase();
    const [open_positions, setOpenPositions] = useState<Record<number, TPosition>>({});
    const [closed_positions, setClosedPositions] = useState<TPosition[]>([]);
    const [is_loading, setIsLoading] = useState(true);

    const symbol_names_ref = useRef<Record<string, string>>({});
    const seen_open_ids_ref = useRef<Set<number>>(new Set());
    const notified_ids_ref = useRef<Set<number>>(new Set());

    useEffect(() => {
        let is_current = true;

        api_base
            .getActiveSymbols?.()
            .then((symbols: TActiveSymbol[]) => {
                if (!is_current || !Array.isArray(symbols)) return;

                const map: Record<string, string> = {};
                symbols.forEach(symbol => {
                    const code = getSymbolCode(symbol);
                    if (code) map[code] = symbol.display_name || code;
                });
                symbol_names_ref.current = map;
            })
            .catch(() => {
                /* cards fall back to the raw symbol code */
            });

        return () => {
            is_current = false;
        };
    }, []);

    useEffect(() => {
        if (!isAuthorized || !api_base.api) {
            setIsLoading(false);

            return;
        }

        let is_current = true;
        setIsLoading(true);

        Promise.all([
            api_base.api.send({ portfolio: 1 }),
            api_base.api.send({ profit_table: 1, description: 1, limit: 50, sort: 'DESC' }),
        ])
            .then(([portfolio_res, profit_res]: any[]) => {
                if (!is_current) return;

                const contracts: TRawOpenContract[] = portfolio_res?.portfolio?.contracts ?? [];
                const initial_open: Record<number, TPosition> = {};

                contracts.forEach(contract => {
                    if (!contract.contract_id) return;
                    initial_open[contract.contract_id] = toPositionFromOpenContract(
                        contract,
                        symbol_names_ref.current
                    );
                });

                setOpenPositions(initial_open);
                seen_open_ids_ref.current = new Set(Object.keys(initial_open).map(Number));

                const transactions: TRawProfitTableRow[] = profit_res?.profit_table?.transactions ?? [];

                setClosedPositions(
                    transactions
                        .filter(transaction => transaction.contract_id)
                        .map(transaction => toPositionFromProfitTableRow(transaction, symbol_names_ref.current, currency))
                );
            })
            .catch(() => {
                /* an empty list is a safe fallback — the subscription below can still populate it */
            })
            .finally(() => {
                if (is_current) setIsLoading(false);
            });

        const unsubscribe = subscribeToStream<TRawOpenContract>({
            request: { proposal_open_contract: 1 },
            msg_type: 'proposal_open_contract',
            onData: raw => {
                if (!raw.contract_id) return;

                const position = toPositionFromOpenContract(raw, symbol_names_ref.current);

                if (position.is_sold) {
                    setOpenPositions(prev => {
                        if (!(position.contract_id in prev)) return prev;

                        const next = { ...prev };
                        delete next[position.contract_id];

                        return next;
                    });

                    setClosedPositions(prev =>
                        prev.some(existing => existing.contract_id === position.contract_id)
                            ? prev
                            : [position, ...prev]
                    );

                    if (
                        seen_open_ids_ref.current.has(position.contract_id) &&
                        !notified_ids_ref.current.has(position.contract_id)
                    ) {
                        notified_ids_ref.current.add(position.contract_id);

                        showTradeResultToast({
                            profit: position.profit,
                            currency: position.currency || currency,
                            side_label: position.side_label,
                            symbol_label: position.display_name,
                        });
                    }
                } else {
                    seen_open_ids_ref.current.add(position.contract_id);
                    setOpenPositions(prev => ({ ...prev, [position.contract_id]: position }));
                }
            },
        });

        return () => {
            is_current = false;
            unsubscribe();
        };
    }, [isAuthorized, currency]);

    const open_list = useMemo(
        () => Object.values(open_positions).sort((a, b) => (b.date_start ?? 0) - (a.date_start ?? 0)),
        [open_positions]
    );

    return { open_positions: open_list, closed_positions, is_loading };
};

export default usePositions;
