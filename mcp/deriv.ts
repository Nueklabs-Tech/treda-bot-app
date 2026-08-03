/**
 * Minimal Node client for the Deriv `trading/v1/options` API, used by the MCP
 * server. The browser app talks to the same endpoints through `DerivAPIBasic`
 * (src/external/bot-skeleton/services/api/appId.js); this is a dependency-free
 * equivalent for a headless process.
 *
 * Two important differences from the legacy Deriv API that the vendored bot
 * docs describe:
 *   - the symbol field is `underlying_symbol`, not `symbol` (sending `symbol`
 *     to `proposal` fails with "Properties not allowed: symbol")
 *   - `active_symbols` takes no `product_type`, and `contracts_for` takes no
 *     `currency` — either one is rejected as InputValidationFailed
 * Both were confirmed against the live production socket.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import WebSocket from 'ws';

export const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

type BrandConfig = {
    platform: {
        derivws: {
            url: { staging: string; production: string };
            directories: { options: string; derivatives: string };
        };
    };
};

const brand: BrandConfig = JSON.parse(readFileSync(join(REPO_ROOT, 'brand.config.json'), 'utf8'));

/**
 * Mirrors `getEnv()` in src/external/deriv-core/config/urls.ts — anything that
 * is not literally 'preview'/'staging' resolves to production, so a typo'd env
 * var can't silently point market data at staging.
 */
const isPreview = () => {
    const env = process.env.NEXT_PUBLIC_DERIV_ENV;
    return env === 'preview' || env === 'staging';
};

/** e.g. `https://api.derivws.com/trading/v1/options/` */
export const getRestBase = () => {
    const base = brand.platform.derivws.url[isPreview() ? 'staging' : 'production'];
    return `${base}${brand.platform.derivws.directories.options}`;
};

/** e.g. `wss://api.derivws.com/trading/v1/options/ws/public` */
export const getPublicWsUrl = () => `${getRestBase()}ws/public`.replace(/^http/, 'ws');

const REQUEST_TIMEOUT_MS = 20_000;
const IDLE_CLOSE_MS = 60_000;

type Pending = { resolve: (value: any) => void; reject: (error: Error) => void; timer: NodeJS.Timeout };

/**
 * A single shared socket, reconnected on demand and dropped after it goes idle
 * so the MCP process is never held open by a connection nobody is using.
 * Every tool here is request/response — nothing subscribes, so there are no
 * streams to tear down.
 */
class DerivSocket {
    private socket: WebSocket | null = null;
    private opening: Promise<WebSocket> | null = null;
    private pending = new Map<number, Pending>();
    private next_req_id = 1;
    private idle_timer: NodeJS.Timeout | null = null;

    private async connect(): Promise<WebSocket> {
        if (this.socket?.readyState === WebSocket.OPEN) return this.socket;
        if (this.opening) return this.opening;

        this.opening = new Promise<WebSocket>((resolve, reject) => {
            const socket = new WebSocket(getPublicWsUrl());

            socket.on('open', () => {
                this.socket = socket;
                this.opening = null;
                resolve(socket);
            });

            socket.on('message', raw => this.onMessage(raw.toString()));

            socket.on('error', error => {
                this.opening = null;
                this.failAll(error instanceof Error ? error : new Error(String(error)));
                reject(error instanceof Error ? error : new Error(String(error)));
            });

            socket.on('close', () => {
                if (this.socket === socket) this.socket = null;
                this.opening = null;
                this.failAll(new Error('Deriv WebSocket closed before the response arrived'));
            });
        });

        return this.opening;
    }

    private onMessage(raw: string) {
        let message: any;
        try {
            message = JSON.parse(raw);
        } catch {
            return;
        }

        const entry = this.pending.get(message.req_id);
        if (!entry) return;

        clearTimeout(entry.timer);
        this.pending.delete(message.req_id);
        this.scheduleIdleClose();

        if (message.error) {
            entry.reject(new Error(`${message.error.code}: ${message.error.message}`));
        } else {
            entry.resolve(message);
        }
    }

    private failAll(error: Error) {
        for (const entry of this.pending.values()) {
            clearTimeout(entry.timer);
            entry.reject(error);
        }
        this.pending.clear();
    }

    private scheduleIdleClose() {
        if (this.idle_timer) clearTimeout(this.idle_timer);
        if (this.pending.size > 0) return;

        this.idle_timer = setTimeout(() => {
            if (this.pending.size === 0) this.socket?.close();
        }, IDLE_CLOSE_MS);
        // Do not keep the event loop alive just for the idle timer.
        this.idle_timer.unref?.();
    }

    async send<T = any>(request: Record<string, unknown>): Promise<T> {
        const socket = await this.connect();
        const req_id = this.next_req_id++;

        return new Promise<T>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(req_id);
                reject(
                    new Error(`Deriv API request timed out after ${REQUEST_TIMEOUT_MS}ms: ${Object.keys(request)[0]}`)
                );
            }, REQUEST_TIMEOUT_MS);

            this.pending.set(req_id, { resolve, reject, timer });
            socket.send(JSON.stringify({ ...request, req_id }));
        });
    }
}

const socket = new DerivSocket();

export type ActiveSymbol = {
    underlying_symbol: string;
    underlying_symbol_name: string;
    market: string;
    submarket: string;
    exchange_is_open: 0 | 1;
    is_trading_suspended: 0 | 1;
    pip_size: number;
};

export async function activeSymbols(): Promise<ActiveSymbol[]> {
    const response = await socket.send<{ active_symbols: ActiveSymbol[] }>({ active_symbols: 'brief' });
    return response.active_symbols ?? [];
}

export async function ticksHistory(params: {
    symbol: string;
    count: number;
    style: 'ticks' | 'candles';
    granularity?: number;
}) {
    return socket.send({
        ticks_history: params.symbol,
        end: 'latest',
        count: params.count,
        style: params.style,
        ...(params.style === 'candles' ? { granularity: params.granularity ?? 60 } : {}),
    });
}

export type ContractOption = {
    contract_type: string;
    contract_category: string;
    sentiment: string;
    expiry_type: string;
    min_contract_duration: string;
    max_contract_duration: string;
    barriers: number;
    default_stake?: number;
    growth_rate_range?: number[];
};

export async function contractsFor(symbol: string): Promise<ContractOption[]> {
    const response = await socket.send<{ contracts_for: { available: ContractOption[] } }>({ contracts_for: symbol });
    return response.contracts_for?.available ?? [];
}

export async function proposal(params: Record<string, unknown>) {
    const response = await socket.send<{ proposal: Record<string, unknown> }>({ proposal: 1, ...params });
    return response.proposal;
}

export async function serverTime(): Promise<number> {
    const response = await socket.send<{ time: number }>({ time: 1 });
    return response.time;
}

export type DerivAccount = {
    account_id: string;
    balance: string;
    currency: string;
    group: string;
    status: string;
    account_type: 'demo' | 'real';
};

/**
 * Account data comes from the REST side, not the socket: the public WS URL is
 * unauthenticated, and the app reaches authorized data by exchanging an OAuth
 * access token for a per-account OTP socket URL
 * (src/services/derivws-accounts.service.ts). Listing accounts only needs the
 * bearer token, so this stops one step short of that.
 */
export async function fetchAccounts(access_token: string): Promise<DerivAccount[]> {
    const response = await fetch(`${getRestBase()}accounts`, {
        headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!response.ok) {
        throw new Error(
            `Deriv accounts request failed: ${response.status} ${response.statusText}. ` +
                'The access token may be expired — copy a fresh one from the app.'
        );
    }

    const body = (await response.json()) as { data?: DerivAccount[] };
    return body.data ?? [];
}
