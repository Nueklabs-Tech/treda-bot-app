import { useEffect, useState } from 'react';

const pad = (value: number) => String(value).padStart(2, '0');

/** `mm:ss`, or `hh:mm:ss` once the remaining time reaches an hour. */
export const formatCountdown = (seconds_left: number): string => {
    const total = Math.max(0, Math.floor(seconds_left));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;

    return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
};

/**
 * Ticks down to `date_expiry` (epoch seconds) once a second, for the countdown
 * shown on an open position. `null` once there is nothing to count down to —
 * either no expiry was given (pure tick contracts don't carry one) or it has
 * already passed.
 */
export const useCountdown = (date_expiry?: number | null): string | null => {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!date_expiry) return;

        const id = setInterval(() => setNow(Date.now()), 1000);

        return () => clearInterval(id);
    }, [date_expiry]);

    if (!date_expiry) return null;

    const seconds_left = date_expiry - Math.floor(now / 1000);

    if (seconds_left <= 0) return formatCountdown(0);

    return formatCountdown(seconds_left);
};

export default useCountdown;
