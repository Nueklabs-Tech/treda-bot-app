// @ts-nocheck — vendored bot code with known upstream type gaps; see AGENTS.md
import { getAccountId, getAccountType, isDemoAccount, removeUrlParameter } from '@/utils/account-helpers';

import CommonStore from '@/stores/common-store';
import { DerivWSAccountsService } from '@/services/derivws-accounts.service';
import { fetchUserProfile } from '@/services/user-profile.service';
import { TAuthData } from '@/types/api-types';
import { clearAuthData } from '@/utils/auth-utils';
import { handleBackendError, isBackendError } from '@/utils/error-handler';
import { activeSymbolsProcessorService } from '../../../../services/active-symbols-processor.service';
import { observer as globalObserver } from '../../utils/observer';
import { doUntilDone, socket_state } from '../tradeEngine/utils/helpers';
import {
    CONNECTION_STATUS,
    mergeAuthData,
    setAccountList,
    setAuthData,
    setConnectionStatus,
    setIsAuthorized,
    setIsAuthorizing,
} from './observables/connection-status-stream';
import ApiHelpers from './api-helpers';
import { generateDerivApiInstance, V2GetActiveAccountId } from './appId';
import chart_api from './chart-api';

type CurrentSubscription = {
    id: string;
    unsubscribe: () => void;
};

type SubscriptionPromise = Promise<{
    subscription: CurrentSubscription;
}>;

type TApiBaseApi = {
    connection: {
        readyState: keyof typeof socket_state;
        addEventListener: (event: string, callback: () => void) => void;
        removeEventListener: (event: string, callback: () => void) => void;
    };
    send: (data: unknown) => void;
    disconnect: () => void;
    authorize: (token: string) => Promise<{ authorize: TAuthData; error: unknown }>;

    onMessage: () => {
        subscribe: (callback: (message: unknown) => void) => {
            unsubscribe: () => void;
        };
    };
} & ReturnType<typeof generateDerivApiInstance>;

class APIBase {
    api: TApiBaseApi | null = null;
    token: string = '';
    account_id: string = '';
    pip_sizes = {};
    account_info = {};
    is_running = false;
    subscriptions: CurrentSubscription[] = [];
    time_interval: ReturnType<typeof setInterval> | null = null;
    has_active_symbols = false;
    is_stopping = false;
    active_symbols: any[] = [];
    current_auth_subscriptions: SubscriptionPromise[] = [];
    is_authorized = false;
    active_symbols_promise: Promise<any[] | undefined> | null = null;
    common_store: CommonStore | undefined;
    reconnection_attempts: number = 0;

    // Constants for timeouts - extracted magic numbers for better maintainability
    private readonly ACTIVE_SYMBOLS_TIMEOUT_MS = 10000; // 10 seconds
    private readonly ENRICHMENT_TIMEOUT_MS = 10000; // 10 seconds
    private readonly MAX_RECONNECTION_ATTEMPTS = 5; // Maximum number of reconnection attempts before session reset
    private readonly SOCKET_OPEN_TIMEOUT_MS = 15000; // How long to wait for the socket before giving up on a request
    private readonly ACTIVE_SYMBOLS_MAX_ATTEMPTS = 3; // Attempts before the active-symbols fetch is reported as failed
    private readonly ACTIVE_SYMBOLS_RETRY_DELAY_MS = 1000; // Base delay between active-symbols attempts

    // In-flight active-symbols request, so concurrent callers share one API call.
    private active_symbols_request: Promise<any[]> | null = null;

    unsubscribeAllSubscriptions = () => {
        this.current_auth_subscriptions?.forEach(subscription_promise => {
            subscription_promise.then(({ subscription }) => {
                if (subscription?.id) {
                    this.api?.send({
                        forget: subscription.id,
                    });
                }
            });
        });
        this.current_auth_subscriptions = [];
    };

    onsocketopen() {
        setConnectionStatus(CONNECTION_STATUS.OPENED);

        // Reset reconnection attempts on successful connection
        this.reconnection_attempts = 0;

        const currentClientStore = globalObserver.getState('client.store');
        if (currentClientStore) {
            currentClientStore.setIsAccountRegenerating(false);
        }

        this.handleTokenExchangeIfNeeded();
    }

    private async handleTokenExchangeIfNeeded() {
        const urlParams = new URLSearchParams(window.location.search);
        const account_id = urlParams.get('account_id');
        const accountType = urlParams.get('account_type');

        if (account_id) {
            localStorage.setItem('active_loginid', account_id);
            // Remove account_id from URL after storing
            removeUrlParameter('account_id');
        }
        if (accountType) {
            localStorage.setItem('account_type', accountType);
            // Remove account_type from URL after storing
            removeUrlParameter('account_type');
        }

        // Check if we have an account_id from URL or localStorage
        let activeAccountId: string | null = getAccountId();

        // If no account_id in localStorage, check sessionStorage for accounts
        if (!activeAccountId) {
            try {
                const storedAccounts = sessionStorage.getItem('deriv_accounts');
                if (storedAccounts) {
                    const accounts = JSON.parse(storedAccounts);
                    if (accounts && accounts.length > 0 && accounts[0].account_id) {
                        // Use the first account as default
                        const accountId = accounts[0].account_id as string;
                        activeAccountId = accountId;
                        localStorage.setItem('active_loginid', accountId);

                        // Set account type based on account_id prefix
                        const isDemo = accountId.startsWith('VRT') || accountId.startsWith('VRTC');
                        localStorage.setItem('account_type', isDemo ? 'demo' : 'real');
                    }
                }
            } catch (error) {
                console.error('[APIBase] Error reading accounts from sessionStorage:', error);
            }
        }

        // Now proceed with normal authorization if we have an account_id
        if (activeAccountId) {
            setIsAuthorizing(true);
            await this.authorizeAndSubscribe();
        }
    }

    onsocketclose() {
        setConnectionStatus(CONNECTION_STATUS.CLOSED);
        this.reconnectIfNotConnected();
    }

    async init(force_create_connection = false) {
        this.toggleRunButton(true);

        if (this.api) {
            this.unsubscribeAllSubscriptions();
        }

        // Reset reconnection attempts counter on successful connection initialization
        if (!force_create_connection) {
            this.reconnection_attempts = 0;
        }

        if (!this.api || this.api?.connection.readyState !== 1 || force_create_connection) {
            if (this.api?.connection) {
                ApiHelpers.disposeInstance();
                setConnectionStatus(CONNECTION_STATUS.CLOSED);
                this.api.disconnect();
                this.api.connection.removeEventListener('open', this.onsocketopen.bind(this));
                this.api.connection.removeEventListener('close', this.onsocketclose.bind(this));
            }

            this.api = await generateDerivApiInstance();

            this.api?.connection.addEventListener('open', this.onsocketopen.bind(this));
            this.api?.connection.addEventListener('close', this.onsocketclose.bind(this));

            // Store the current account ID used for this WebSocket connection
            // This will be used to check if we need to regenerate the connection when the tab becomes active
            const currentClientStore = globalObserver.getState('client.store');
            if (currentClientStore) {
                const active_login_id = getAccountId();
                if (active_login_id) {
                    currentClientStore.setWebSocketLoginId(active_login_id);
                }
            }
        }

        const hasAccountID = V2GetActiveAccountId();

        if (!this.has_active_symbols && !hasAccountID) {
            this.requestActiveSymbols();
        }

        this.initEventListeners();

        if (this.time_interval) clearInterval(this.time_interval);
        this.time_interval = null;

        chart_api.init(force_create_connection);
    }

    getConnectionStatus() {
        if (this.api?.connection) {
            const ready_state = this.api.connection.readyState;
            return socket_state[ready_state as keyof typeof socket_state] || 'Unknown';
        }
        return 'Socket not initialized';
    }

    terminate() {
        // eslint-disable-next-line no-console
        if (this.api) this.api.disconnect();
    }

    initEventListeners() {
        if (window) {
            window.addEventListener('online', this.reconnectIfNotConnected);
            window.addEventListener('focus', this.reconnectIfNotConnected);
        }
    }

    async createNewInstance(account_id: string) {
        if (this.account_id !== account_id) {
            await this.init();
        }
    }

    reconnectIfNotConnected = () => {
        if (this.api?.connection?.readyState && this.api?.connection?.readyState > 1) {
            this.reconnection_attempts += 1;

            if (this.reconnection_attempts >= this.MAX_RECONNECTION_ATTEMPTS) {
                // Reset reconnection counter
                this.reconnection_attempts = 0;

                // Properly handle logout through the API
                setIsAuthorized(false);
                setAccountList([]);
                setAuthData(null);

                // Clear necessary storage items
                localStorage.removeItem('active_loginid');
                localStorage.removeItem('account_type');
                localStorage.removeItem('accountsList');
                localStorage.removeItem('clientAccounts');
            }

            this.init(true);
        }
    };

    async authorizeAndSubscribe() {
        if (!this.api) return;

        this.account_id = getAccountId() || '';
        setIsAuthorizing(true);

        try {
            const { balance, error } = await this.api.balance();

            if (error) {
                const errorMessage = isBackendError(error)
                    ? handleBackendError(error)
                    : error.message || 'Authorization failed';

                // Authorization error
                console.error('Authorization error:', errorMessage);

                setIsAuthorizing(false);
                return { ...error, localizedMessage: errorMessage };
            }

            this.account_info = {
                balance: balance?.balance,
                currency: balance?.currency,
                loginid: balance?.loginid,
            };
            this.token = balance?.loginid;

            const account_type = getAccountType(balance?.loginid);
            const currentAccount = balance?.loginid
                ? {
                      balance: balance.balance,
                      currency: balance.currency || 'USD',
                      is_virtual: account_type === 'real' ? 0 : 1,
                      loginid: balance.loginid,
                  }
                : null;

            // Build full account list from sessionStorage (populated during OAuth flow)
            // Falls back to just the current account if sessionStorage has no data
            const storedAccounts = DerivWSAccountsService.getStoredAccounts();
            const accountList =
                storedAccounts && storedAccounts.length > 0
                    ? storedAccounts
                          .filter(a => !a.status || a.status === 'active')
                          .map(a => ({
                              balance: parseFloat(a.balance) || 0,
                              currency: a.currency || 'USD',
                              is_virtual: a.account_type === 'demo' ? 1 : 0,
                              loginid: a.account_id,
                          }))
                    : currentAccount
                      ? [currentAccount]
                      : [];

            setAccountList(accountList); // Observable stream
            setAuthData({
                balance: balance?.balance,
                currency: balance?.currency,
                loginid: balance?.loginid,
                is_virtual: account_type === 'real' ? 0 : 1,
                account_list: accountList,
            });

            // // Set account_type in localStorage based on loginid prefix using centralized utility
            const loginid = balance?.loginid || '';
            const isDemo = isDemoAccount(loginid);

            if (isDemo) {
                localStorage.setItem('account_type', 'demo');
            } else {
                localStorage.setItem('account_type', 'real');
            }

            globalObserver.emit('api.authorize', {
                account_list: accountList,
                current_account: {
                    loginid: balance?.loginid,
                    currency: balance?.currency || 'USD',
                    is_virtual: account_type === 'real' ? 0 : 1,
                    balance: typeof balance?.balance === 'number' ? balance.balance : undefined,
                },
            });

            // Update the WebSocket login ID in the client store
            const currentClientStore = globalObserver.getState('client.store');
            if (currentClientStore && balance?.loginid) {
                currentClientStore.setWebSocketLoginId(balance.loginid);
            }

            setIsAuthorized(true);
            this.is_authorized = true;

            // Deliberately not awaited: the user's name is display polish, and the
            // run panel / chart must not wait on it to become usable.
            this.loadUserProfile(balance?.loginid);

            localStorage.setItem('client_account_details', JSON.stringify(accountList));
            localStorage.setItem('client.country', balance?.country);

            if (balance?.loginid) {
                localStorage.setItem('active_loginid', balance.loginid);
            }

            if (this.has_active_symbols) {
                this.toggleRunButton(false);
            } else {
                this.requestActiveSymbols();
            }
            this.subscribe();
        } catch (e) {
            this.is_authorized = false;
            clearAuthData();
            setIsAuthorized(false);
            globalObserver.emit('Error', e);
        } finally {
            setIsAuthorizing(false);
        }
    }

    /**
     * Pulls the account holder's real name and email onto the auth stream, so the
     * UI can greet the user by name instead of falling back to "Trader".
     */
    async loadUserProfile(loginid) {
        const profile = await fetchUserProfile(this.api);
        if (profile) mergeAuthData(profile, loginid);
    }

    async subscribe() {
        const subscribeToStream = (streamName: string) => {
            return doUntilDone(
                () => {
                    const subscription = this.api?.send({
                        [streamName]: 1,
                        subscribe: 1,
                    });

                    if (subscription) {
                        this.current_auth_subscriptions.push(subscription);
                    }
                    return subscription;
                },
                [],
                this
            );
        };

        const streamsToSubscribe = ['balance', 'transaction', 'proposal_open_contract'];

        await Promise.all(streamsToSubscribe.map(subscribeToStream));
    }

    /**
     * Races a promise against a timer, always clearing the timer so a slow-but-successful
     * request does not leave a pending timeout behind.
     */
    private withTimeout = (promise, timeout_ms: number, message: string) => {
        let timer: ReturnType<typeof setTimeout>;

        const timeout = new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error(message)), timeout_ms);
        });

        return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
    };

    /**
     * Resolves once the socket is OPEN. `init()` kicks off requests while the connection
     * may still be CONNECTING, and sending then would burn the request timeout on
     * connection setup rather than on the request itself.
     */
    private waitForSocketOpen = (timeout_ms = this.SOCKET_OPEN_TIMEOUT_MS) => {
        if (this.api?.connection?.readyState === 1) return Promise.resolve();

        return new Promise<void>((resolve, reject) => {
            const started_at = Date.now();

            const poll = setInterval(() => {
                // Polling rather than an 'open' listener: `this.api` may be swapped for a
                // fresh instance mid-wait, and the listener would be left on the old one.
                if (this.api?.connection?.readyState === 1) {
                    clearInterval(poll);
                    resolve();
                } else if (Date.now() - started_at >= timeout_ms) {
                    clearInterval(poll);
                    reject(new Error('WebSocket connection timeout while waiting to fetch active symbols'));
                }
            }, 100);
        });
    };

    private processActiveSymbolsResponse = async (active_symbols: any[]) => {
        this.has_active_symbols = true;

        // Process active symbols using the dedicated service with fallback
        try {
            const processedResult = await this.withTimeout(
                activeSymbolsProcessorService.processActiveSymbols(active_symbols),
                this.ENRICHMENT_TIMEOUT_MS,
                'Enrichment timeout'
            );

            this.active_symbols = processedResult.enrichedSymbols;
            this.pip_sizes = processedResult.pipSizes;
        } catch (enrichmentError) {
            console.warn('Symbol enrichment failed, using raw symbols:', enrichmentError);
            // Fallback to raw symbols if enrichment fails
            this.active_symbols = active_symbols;
            this.pip_sizes = {};
        }

        this.toggleRunButton(false);
        return this.active_symbols;
    };

    private fetchActiveSymbols = async () => {
        if (!this.api) {
            throw new Error('API connection not available for fetching active symbols');
        }

        await this.waitForSocketOpen();

        let last_error;

        for (let attempt = 1; attempt <= this.ACTIVE_SYMBOLS_MAX_ATTEMPTS; attempt++) {
            try {
                const apiResult = await this.withTimeout(
                    doUntilDone(() => this.api?.send({ active_symbols: 'brief' }), [], this),
                    this.ACTIVE_SYMBOLS_TIMEOUT_MS,
                    'Active symbols fetch timeout'
                );

                const { active_symbols = [], error = {} } = (apiResult ?? {}) as any;

                if (error && Object.keys(error).length > 0) {
                    throw new Error(`Active symbols API error: ${error.message || 'Unknown error'}`);
                }

                if (!active_symbols.length) {
                    throw new Error('No active symbols received from API');
                }

                return await this.processActiveSymbolsResponse(active_symbols);
            } catch (error) {
                last_error = error;

                if (attempt < this.ACTIVE_SYMBOLS_MAX_ATTEMPTS) {
                    console.warn(
                        `Active symbols fetch attempt ${attempt}/${this.ACTIVE_SYMBOLS_MAX_ATTEMPTS} failed, retrying:`,
                        error
                    );
                    await new Promise(resolve => setTimeout(resolve, this.ACTIVE_SYMBOLS_RETRY_DELAY_MS * attempt));
                    await this.waitForSocketOpen();
                }
            }
        }

        console.error('Failed to fetch and process active symbols:', last_error);
        throw last_error;
    };

    getActiveSymbols = () => {
        // Several call sites (init, authorize, the chart and the trade page) can ask for
        // symbols at once; they share a single request instead of racing duplicates.
        if (!this.active_symbols_request) {
            this.active_symbols_request = this.fetchActiveSymbols().finally(() => {
                this.active_symbols_request = null;
            });
        }

        return this.active_symbols_request;
    };

    /**
     * Starts a symbols fetch and publishes it as `active_symbols_promise` for other
     * callers to await. The failure handler is attached here so an unobserved failure
     * never surfaces as an "Uncaught (in promise)" — awaiters of the same promise still
     * see the rejection.
     */
    private requestActiveSymbols = () => {
        const request = this.getActiveSymbols();

        this.active_symbols_promise = request;

        request.catch(error => {
            console.warn('Active symbols are unavailable:', error);

            // Drop the rejected promise so the next caller starts a fresh request
            // instead of re-awaiting a failure.
            if (this.active_symbols_promise === request) {
                this.active_symbols_promise = null;
            }
        });

        return request;
    };

    toggleRunButton = (toggle: boolean) => {
        const run_button = document.querySelector('#db-animation__run-button');
        if (!run_button) return;
        (run_button as HTMLButtonElement).disabled = toggle;
    };

    setIsRunning(toggle = false) {
        this.is_running = toggle;
    }

    pushSubscription(subscription: CurrentSubscription) {
        this.subscriptions.push(subscription);
    }

    clearSubscriptions() {
        this.subscriptions.forEach(s => s.unsubscribe());
        this.subscriptions = [];

        // Resetting timeout resolvers
        const global_timeouts = globalObserver.getState('global_timeouts') ?? [];

        global_timeouts.forEach((_: unknown, i: number) => {
            clearTimeout(i);
        });
    }
}

export const api_base = new APIBase();
