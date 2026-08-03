import { useEffect, useState } from 'react';
import {
    account_list$,
    authData$,
    CONNECTION_STATUS,
    connectionStatus$,
    isAuthorized$,
    isAuthorizing$,
} from '@/external/bot-skeleton/services/api/observables/connection-status-stream';
import { TAuthData } from '@/types/api-types';

export const useApiBase = () => {
    // These are all BehaviorSubjects, so seed from their current value rather
    // than waiting for the subscriptions below: the effect only runs after the
    // first render, and consumers that redirect on a falsy value (e.g. the
    // profile page's logged-out guard) would fire before it ever arrives.
    const [connectionStatus, setConnectionStatus] = useState<CONNECTION_STATUS>(
        () => connectionStatus$.getValue() as CONNECTION_STATUS
    );
    const [isAuthorized, setIsAuthorized] = useState<boolean>(() => isAuthorized$.getValue());
    const [isAuthorizing, setIsAuthorizing] = useState<boolean>(() => isAuthorizing$.getValue());
    const [accountList, setAccountList] = useState<TAuthData['account_list']>(() => account_list$.getValue());
    const [authData, setAuthData] = useState<TAuthData | null>(() => authData$.getValue());
    const [activeLoginid, setActiveLoginid] = useState<string>(() => authData$.getValue()?.loginid ?? '');

    useEffect(() => {
        const connectionStatusSubscription = connectionStatus$.subscribe(status => {
            setConnectionStatus(status as CONNECTION_STATUS);
        });

        const isAuthorizedSubscription = isAuthorized$.subscribe(isAuthorized => {
            setIsAuthorized(isAuthorized);
        });

        const isAuthorizingSubscription = isAuthorizing$.subscribe(isAuthorizing => {
            setIsAuthorizing(isAuthorizing);
        });
        const accountListSubscription = account_list$.subscribe(accountList => {
            setAccountList(accountList);
        });
        const authDataSubscription = authData$.subscribe(authData => {
            setAuthData(authData);
            setActiveLoginid(authData?.loginid ?? '');
        });

        return () => {
            connectionStatusSubscription.unsubscribe();
            isAuthorizedSubscription.unsubscribe();
            isAuthorizingSubscription.unsubscribe();
            accountListSubscription.unsubscribe();
            authDataSubscription.unsubscribe();
        };
    }, []);

    return { connectionStatus, isAuthorized, isAuthorizing, accountList, authData, activeLoginid, setIsAuthorizing };
};
