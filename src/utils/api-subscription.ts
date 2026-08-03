import { api_base } from '@/external/bot-skeleton';

export type TApiError = { code?: string; message?: string };

type TSubscribeArgs<TPayload> = {
    /** The request minus `subscribe`, e.g. `{ ticks: 'R_100' }`. */
    request: Record<string, unknown>;
    /** `msg_type` of the responses to keep, e.g. `tick`, `proposal`. */
    msg_type: string;
    onData: (payload: TPayload) => void;
    onError?: (error: TApiError) => void;
};

const toApiError = (error: unknown): TApiError => {
    const candidate = error as { error?: TApiError; message?: string } | undefined;

    return candidate?.error ?? { message: candidate?.message ?? 'Unknown error' };
};

/**
 * One streaming Deriv API subscription on the authorized `api_base` socket.
 *
 * `api_base.api.send()` resolves with the first response only; the updates that
 * follow arrive on the shared `onMessage()` stream, mixed in with every other
 * subscription on the socket. This filters that stream down to the caller's own
 * subscription id and forgets it on teardown — the part every caller would
 * otherwise have to repeat.
 *
 * Returns the unsubscribe function; calling it before the first response has
 * landed still forgets the subscription once it does.
 */
export const subscribeToStream = <TPayload>({ request, msg_type, onData, onError }: TSubscribeArgs<TPayload>) => {
    const api = api_base.api;
    let is_cancelled = false;
    let subscription_id: string | null = null;
    let message_subscription: { unsubscribe: () => void } | null = null;

    const forget = (id: string | null) => {
        if (!id) return;
        Promise.resolve(api?.send({ forget: id })).catch(() => {
            /* the socket is gone, so the subscription is too */
        });
    };

    if (!api) {
        onError?.({ message: 'No connection to the trading server' });

        return () => {};
    }

    Promise.resolve(api.send({ ...request, subscribe: 1 }))
        .then((response: any) => {
            const id = response?.subscription?.id ?? null;

            if (is_cancelled) {
                forget(id);

                return;
            }

            subscription_id = id;

            if (response?.[msg_type]) onData(response[msg_type] as TPayload);

            message_subscription = api.onMessage().subscribe(({ data }: any) => {
                if (is_cancelled || !data || data.msg_type !== msg_type) return;
                // Before the first response there is no id to match on, so the
                // filter starts once one is known.
                if (subscription_id && data.subscription?.id && data.subscription.id !== subscription_id) return;

                if (data.error) {
                    onError?.(data.error);

                    return;
                }

                if (data[msg_type]) onData(data[msg_type] as TPayload);
            });
        })
        .catch(error => {
            if (!is_cancelled) onError?.(toApiError(error));
        });

    return () => {
        is_cancelled = true;
        message_subscription?.unsubscribe();
        forget(subscription_id);
        subscription_id = null;
    };
};

/** Number of decimals a symbol's prices are quoted to, derived from its pip size. */
export const getPipDecimals = (pip?: number): number => {
    if (!pip || pip <= 0) return 2;

    return Math.max(0, Math.round(-Math.log10(pip)));
};
