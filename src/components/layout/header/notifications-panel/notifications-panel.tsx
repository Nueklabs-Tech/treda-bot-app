import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { Localize, localize } from '@deriv-com/translations';
import { clearNotifications, markAllNotificationsRead, TNotification, useNotifications } from './notifications-feed';
// @ts-ignore: Allow side-effect import of SCSS without type declarations
import './notifications-panel.scss';

type TNotificationsPanelProps = {
    is_open: boolean;
    onClose: () => void;
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const formatRelativeTime = (timestamp: number) => {
    const elapsed = Date.now() - timestamp;

    if (elapsed < MINUTE) return localize('Just now');
    if (elapsed < HOUR) return localize('{{count}}m ago', { count: Math.floor(elapsed / MINUTE) });
    if (elapsed < DAY) return localize('{{count}}h ago', { count: Math.floor(elapsed / HOUR) });
    return new Date(timestamp).toLocaleDateString();
};

const KindIcon = ({ kind }: { kind: TNotification['kind'] }) => (
    <span className={clsx('notifications-panel__icon', `notifications-panel__icon--${kind}`)} aria-hidden='true'>
        <svg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
            {kind === 'success' ? (
                <path
                    d='m3.5 8.4 3 3 6-6.4'
                    stroke='currentColor'
                    strokeWidth='1.8'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                />
            ) : (
                <>
                    <path d='M8 4.2v4.6' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' />
                    <circle cx='8' cy='11.6' r='1' fill='currentColor' />
                </>
            )}
        </svg>
    </span>
);

/**
 * Right-hand notifications drawer, rendered in a portal so the header's stacking
 * context and overflow cannot clip it. Slides in from the inline end and covers
 * the full screen on handsets, which is the mobile-app pattern the header icons
 * imply.
 */
const NotificationsPanel = ({ is_open, onClose }: TNotificationsPanelProps) => {
    const { notifications, unread_count } = useNotifications();

    // Opening the drawer is the "read" signal — the badge should not survive a
    // visit to the panel.
    useEffect(() => {
        if (is_open) markAllNotificationsRead();
    }, [is_open, notifications.length]);

    useEffect(() => {
        if (!is_open) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleKeyDown);
        // The drawer owns the viewport while open; letting the page behind it
        // scroll is the classic mobile-sheet bug.
        const previous_overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previous_overflow;
        };
    }, [is_open, onClose]);

    return createPortal(
        <div className={clsx('notifications-panel', { 'notifications-panel--open': is_open })} aria-hidden={!is_open}>
            <div className='notifications-panel__backdrop' onClick={onClose} />
            <aside
                className='notifications-panel__drawer'
                role='dialog'
                aria-modal='true'
                aria-label={localize('Notifications')}
            >
                <header className='notifications-panel__header'>
                    <div className='notifications-panel__title'>
                        <h2>
                            <Localize i18n_default_text='Notifications' />
                        </h2>
                        {unread_count > 0 && <span className='notifications-panel__count'>{unread_count}</span>}
                    </div>
                    <button
                        type='button'
                        className='notifications-panel__close'
                        onClick={onClose}
                        aria-label={localize('Close notifications')}
                    >
                        <svg width='18' height='18' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
                            <path
                                d='M6 6l12 12M18 6 6 18'
                                stroke='currentColor'
                                strokeWidth='1.8'
                                strokeLinecap='round'
                            />
                        </svg>
                    </button>
                </header>

                <div className='notifications-panel__body'>
                    {notifications.length === 0 ? (
                        <div className='notifications-panel__empty'>
                            <span className='notifications-panel__empty-icon' aria-hidden='true'>
                                🔔
                            </span>
                            <p className='notifications-panel__empty-title'>
                                <Localize i18n_default_text='No notifications yet' />
                            </p>
                            <p className='notifications-panel__empty-text'>
                                <Localize i18n_default_text='Alerts about your bot runs and errors will show up here.' />
                            </p>
                        </div>
                    ) : (
                        <ul className='notifications-panel__list'>
                            {notifications.map(notification => (
                                <li
                                    key={notification.id}
                                    className={clsx('notifications-panel__item', {
                                        'notifications-panel__item--unread': !notification.is_read,
                                    })}
                                >
                                    <KindIcon kind={notification.kind} />
                                    <div className='notifications-panel__item-content'>
                                        <p className='notifications-panel__item-title'>{notification.title}</p>
                                        {notification.message && (
                                            <p className='notifications-panel__item-message'>{notification.message}</p>
                                        )}
                                        <time className='notifications-panel__item-time'>
                                            {formatRelativeTime(notification.timestamp)}
                                        </time>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {notifications.length > 0 && (
                    <footer className='notifications-panel__footer'>
                        <button type='button' className='notifications-panel__clear' onClick={clearNotifications}>
                            <Localize i18n_default_text='Clear all' />
                        </button>
                    </footer>
                )}
            </aside>
        </div>,
        document.body
    );
};

export default NotificationsPanel;
