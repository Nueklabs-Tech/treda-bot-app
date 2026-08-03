import { useSyncExternalStore } from 'react';
import { observer as globalObserver } from '@/external/bot-skeleton/utils/observer';
import { localize } from '@deriv-com/translations';

export type TNotificationKind = 'error' | 'info' | 'success';

export type TNotification = {
    id: string;
    kind: TNotificationKind;
    title: string;
    message?: string;
    timestamp: number;
    is_read: boolean;
};

// The feed is a session log, not an inbox — old entries stop being actionable,
// so it is capped rather than persisted.
const MAX_ITEMS = 40;

// Repeated identical messages are common while a bot loops (the same error is
// re-emitted on every tick); collapse them inside this window instead of
// flooding the drawer.
const DEDUPE_WINDOW_MS = 5000;

let notifications: TNotification[] = [];
const listeners = new Set<() => void>();

const emitChange = () => listeners.forEach(listener => listener());

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

const getSnapshot = () => notifications;

let counter = 0;

const toText = (payload: unknown): string => {
    if (!payload) return '';
    if (typeof payload === 'string') return payload;
    if (payload instanceof Error) return payload.message;
    if (typeof payload === 'object') {
        const { message, error } = payload as { message?: unknown; error?: { message?: string } };
        if (typeof message === 'string') return message;
        if (typeof error?.message === 'string') return error.message;
    }
    return '';
};

export const addNotification = (kind: TNotificationKind, title: string, message?: string) => {
    const now = Date.now();
    const [latest] = notifications;

    if (latest && latest.title === title && latest.message === message && now - latest.timestamp < DEDUPE_WINDOW_MS) {
        return;
    }

    counter += 1;
    notifications = [
        { id: `${now}-${counter}`, kind, title, message, timestamp: now, is_read: false },
        ...notifications,
    ].slice(0, MAX_ITEMS);

    emitChange();
};

export const markAllNotificationsRead = () => {
    if (!notifications.some(notification => !notification.is_read)) return;
    notifications = notifications.map(notification =>
        notification.is_read ? notification : { ...notification, is_read: true }
    );
    emitChange();
};

export const clearNotifications = () => {
    if (!notifications.length) return;
    notifications = [];
    emitChange();
};

let is_listening = false;

/**
 * Wires the bot's `globalObserver` events into the feed. Called lazily by
 * `useNotifications` so the header does not pay for it before it renders, and
 * guarded because every mounted consumer would otherwise register again.
 */
const startListening = () => {
    if (is_listening) return;
    is_listening = true;

    globalObserver.register('ui.log.error', (payload: unknown) => {
        addNotification('error', localize('Bot error'), toText(payload) || localize('Something went wrong.'));
    });

    globalObserver.register('Error', (payload: unknown) => {
        addNotification('error', localize('Connection error'), toText(payload) || localize('Something went wrong.'));
    });

    globalObserver.register('ui.log.notify', (payload: unknown) => {
        addNotification('info', localize('Bot message'), toText(payload));
    });

    globalObserver.register('bot.running', () => {
        addNotification('success', localize('Bot started'), localize('Your strategy is now running.'));
    });

    globalObserver.register('bot.stop', () => {
        addNotification('info', localize('Bot stopped'), localize('Your strategy has stopped running.'));
    });
};

export const useNotifications = () => {
    startListening();

    const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    const unread_count = items.reduce((count, notification) => (notification.is_read ? count : count + 1), 0);

    return { notifications: items, unread_count };
};
