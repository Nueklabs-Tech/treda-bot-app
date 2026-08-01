import { getAppName } from '@/utils/branding';
// @ts-ignore: side-effect SCSS import has no type declarations
import './app-loading.scss';

type TAppLoadingProps = {
    /** Status line shown under the constellation. */
    message?: string;
    /** Secondary mono caption. */
    label?: string;
    /** 0–100 progress value driving the bar. Omit for an indeterminate bar. */
    progress?: number;
    /** Label on the progress head (left side). */
    progressLabel?: string;
    /** Icon rendered inside the pulsing core. Any image URL. Falls back to the brand letter mark. */
    iconSrc?: string;
    /** Alt text for the core icon. */
    iconAlt?: string;
};

/** Network nodes orbiting the core (SVG coordinate space is 230×230). */
const NODES: Array<{ x: number; y: number; r: number; delay: number }> = [
    { x: 60, y: 58, r: 5, delay: 0 },
    { x: 176, y: 66, r: 5, delay: 0.3 },
    { x: 52, y: 150, r: 5, delay: 0.6 },
    { x: 182, y: 158, r: 5, delay: 0.9 },
    { x: 115, y: 42, r: 4, delay: 0.45 },
    { x: 115, y: 190, r: 4, delay: 1.1 },
];

const LINKS: Array<[number, number, number, number]> = [
    [115, 115, 60, 58],
    [115, 115, 176, 66],
    [115, 115, 52, 150],
    [115, 115, 182, 158],
    [115, 115, 115, 42],
    [115, 115, 115, 190],
    [60, 58, 115, 42],
    [176, 66, 182, 158],
    [52, 150, 115, 190],
];

const AppLoading = ({
    message = 'Analysing the markets',
    label = 'NEURAL ENGINE · WARMING UP',
    progress,
    progressLabel = 'TRAINING MODEL',
    iconSrc = '/assets/logo/badrobot.png',
    iconAlt = '',
}: TAppLoadingProps) => {
    const is_determinate = typeof progress === 'number' && Number.isFinite(progress);
    const clamped = is_determinate ? Math.max(0, Math.min(100, progress)) : 0;
    const pct = `${Math.round(clamped)}%`;

    return (
        <div
            className='app-loading'
            role='status'
            aria-live='polite'
            aria-busy='true'
            aria-valuenow={is_determinate ? clamped : undefined}
        >
            <div className='app-loading__grid' aria-hidden='true' />

            <div className='app-loading__stage'>
                <div className='app-loading__radar-wrap'>
                    <span className='app-loading__radar' aria-hidden='true' />

                    <svg className='app-loading__net' viewBox='0 0 230 230' aria-hidden='true'>
                        <circle className='app-loading__orbit' cx='115' cy='115' r='106' />
                        <circle className='app-loading__orbit' cx='115' cy='115' r='72' />
                        <g className='app-loading__links'>
                            {LINKS.map(([x1, y1, x2, y2]) => (
                                <line key={`${x1}-${y1}-${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} />
                            ))}
                        </g>
                        <g>
                            {NODES.map(n => (
                                <circle
                                    key={`${n.x}-${n.y}`}
                                    className='app-loading__node'
                                    cx={n.x}
                                    cy={n.y}
                                    r={n.r}
                                    style={{ animationDelay: `${n.delay}s` }}
                                />
                            ))}
                        </g>
                    </svg>

                    <span className='app-loading__core'>
                        {iconSrc ? (
                            <img className='app-loading__core-img' src={iconSrc} alt={iconAlt} />
                        ) : (
                            <span className='app-loading__core-mark' aria-hidden='true'>
                                {getAppName().charAt(0).toUpperCase()}
                            </span>
                        )}
                    </span>
                </div>

                <div className='app-loading__caption'>
                    <span className='app-loading__message'>{message}</span>
                    <span className='app-loading__dots' aria-hidden='true'>
                        <span />
                        <span />
                        <span />
                    </span>
                </div>

                {label ? <div className='app-loading__sub'>{label}</div> : null}

                <div className='app-loading__progress'>
                    <div className='app-loading__progress-head'>
                        <span>{progressLabel}</span>
                        {is_determinate ? <b>{pct}</b> : null}
                    </div>
                    <div className='app-loading__track'>
                        <div
                            className={`app-loading__fill${is_determinate ? '' : ' app-loading__fill--indeterminate'}`}
                            style={is_determinate ? { width: pct } : undefined}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppLoading;
