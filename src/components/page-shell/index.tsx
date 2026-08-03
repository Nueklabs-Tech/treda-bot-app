import { ReactNode } from 'react';
import clsx from 'clsx';
// @ts-ignore: Allow side-effect import of SCSS without type declarations
import './page-shell.scss';

/**
 * Layout primitives shared by the routed screens (home, bots, chart). They exist
 * so the four destinations read as one product: same rhythm, same card shape,
 * same section headings — and one stylesheet instead of three near-copies.
 *
 * Everything below is theme-token only; no component hard-codes a colour.
 */

type TPageShellProps = {
    /** Page name, rendered as the h1. */
    title: ReactNode;
    subtitle?: ReactNode;
    /** Buttons that belong to the page as a whole, aligned to the title. */
    actions?: ReactNode;
    /** Small status chips rendered under the title. */
    meta?: ReactNode;
    className?: string;
    children: ReactNode;
};

export const PageShell = ({ title, subtitle, actions, meta, className, children }: TPageShellProps) => (
    <div className={clsx('page', className)}>
        <div className='page__inner'>
            <header className='page__header'>
                <div className='page__heading'>
                    <h1 className='page__title'>{title}</h1>
                    {subtitle && <p className='page__subtitle'>{subtitle}</p>}
                    {meta && <div className='page__meta'>{meta}</div>}
                </div>
                {actions && <div className='page__actions'>{actions}</div>}
            </header>
            {children}
        </div>
    </div>
);

type TSectionProps = {
    title?: ReactNode;
    description?: ReactNode;
    /** Rendered on the same line as the title, right-aligned. */
    action?: ReactNode;
    className?: string;
    children: ReactNode;
};

export const Section = ({ title, description, action, className, children }: TSectionProps) => (
    <section className={clsx('page-section', className)}>
        {(title || action) && (
            <div className='page-section__head'>
                <div>
                    {title && <h2 className='page-section__title'>{title}</h2>}
                    {description && <p className='page-section__description'>{description}</p>}
                </div>
                {action && <div className='page-section__action'>{action}</div>}
            </div>
        )}
        {children}
    </section>
);

export type TTone = 'neutral' | 'success' | 'danger' | 'warning' | 'info';

type TStatTileProps = {
    label: ReactNode;
    value: ReactNode;
    hint?: ReactNode;
    tone?: TTone;
};

/** One number with its label — the unit the stat grids are built from. */
export const StatTile = ({ label, value, hint, tone = 'neutral' }: TStatTileProps) => (
    <div className={clsx('stat-tile', `stat-tile--${tone}`)}>
        <span className='stat-tile__label'>{label}</span>
        <span className='stat-tile__value'>{value}</span>
        {hint && <span className='stat-tile__hint'>{hint}</span>}
    </div>
);

export const StatGrid = ({ children, columns = 4 }: { children: ReactNode; columns?: 2 | 3 | 4 }) => (
    <div className={clsx('stat-grid', `stat-grid--${columns}`)}>{children}</div>
);

type TPillProps = {
    tone?: TTone;
    children: ReactNode;
    /** Shows a small dot before the label — used for live/connection states. */
    has_dot?: boolean;
};

export const Pill = ({ tone = 'neutral', has_dot, children }: TPillProps) => (
    <span className={clsx('pill', `pill--${tone}`)}>
        {has_dot && <span className='pill__dot' aria-hidden='true' />}
        {children}
    </span>
);

type TActionTileProps = {
    icon: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    onClick: () => void;
    is_disabled?: boolean;
};

export const ActionTile = ({ icon, title, description, onClick, is_disabled }: TActionTileProps) => (
    <button type='button' className='action-tile' onClick={onClick} disabled={is_disabled}>
        <span className='action-tile__icon' aria-hidden='true'>
            {icon}
        </span>
        <span className='action-tile__text'>
            <span className='action-tile__title'>{title}</span>
            {description && <span className='action-tile__description'>{description}</span>}
        </span>
    </button>
);

export const ActionGrid = ({ children }: { children: ReactNode }) => <div className='action-grid'>{children}</div>;

type TEmptyStateProps = {
    icon?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
};

export const EmptyState = ({ icon, title, description, action }: TEmptyStateProps) => (
    <div className='empty-state'>
        {icon && (
            <span className='empty-state__icon' aria-hidden='true'>
                {icon}
            </span>
        )}
        <p className='empty-state__title'>{title}</p>
        {description && <p className='empty-state__description'>{description}</p>}
        {action && <div className='empty-state__action'>{action}</div>}
    </div>
);

type TPageButtonProps = {
    children: ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
    is_disabled?: boolean;
    icon?: ReactNode;
    type?: 'button' | 'submit';
};

export const PageButton = ({
    children,
    onClick,
    variant = 'secondary',
    is_disabled,
    icon,
    type = 'button',
}: TPageButtonProps) => (
    // eslint-disable-next-line react/button-has-type
    <button
        type={type}
        className={clsx('page-button', `page-button--${variant}`)}
        onClick={onClick}
        disabled={is_disabled}
    >
        {icon && (
            <span className='page-button__icon' aria-hidden='true'>
                {icon}
            </span>
        )}
        {children}
    </button>
);

export const Card = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={clsx('page-card', className)}>{children}</div>
);
