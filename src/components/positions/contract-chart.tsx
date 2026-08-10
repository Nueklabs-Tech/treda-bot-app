import { useMemo } from 'react';
import clsx from 'clsx';
import { formatTime } from '@/components/shared';
// @ts-ignore: Allow side-effect import of SCSS without type declarations
import './contract-chart.scss';

export type TChartTick = { epoch: number; tick: number };

type TContractChartProps = {
    ticks: TChartTick[];
    entry_epoch?: number;
    entry_spot?: number;
    exit_epoch?: number;
    exit_spot?: number;
    barrier?: number;
    is_win?: boolean;
};

const PLOT_TOP = 8;
const PLOT_BOTTOM = 78;

/** The price path a settled (or still-running) contract took, with its entry, exit and barrier marked. */
const ContractChart = ({ ticks, entry_epoch, entry_spot, exit_epoch, exit_spot, barrier, is_win }: TContractChartProps) => {
    const geometry = useMemo(() => {
        if (ticks.length < 2) return null;

        const epochs = ticks.map(point => point.epoch);
        const prices = ticks.map(point => point.tick);
        if (typeof entry_spot === 'number') prices.push(entry_spot);
        if (typeof exit_spot === 'number') prices.push(exit_spot);
        if (typeof barrier === 'number') prices.push(barrier);

        const epoch_min = Math.min(...epochs);
        const epoch_max = Math.max(...epochs);
        const price_min = Math.min(...prices);
        const price_max = Math.max(...prices);
        const price_span = price_max - price_min || 1;

        const xPct = (epoch: number) => ((epoch - epoch_min) / (epoch_max - epoch_min || 1)) * 100;
        const yPct = (price: number) => PLOT_TOP + (1 - (price - price_min) / price_span) * (PLOT_BOTTOM - PLOT_TOP);

        const path = ticks.map((point, index) => `${index === 0 ? 'M' : 'L'}${xPct(point.epoch)},${yPct(point.tick)}`).join(' ');

        const history = entry_epoch ? ticks.filter(point => point.epoch <= entry_epoch) : [];
        const area =
            history.length > 1
                ? `M${xPct(history[0].epoch)},${PLOT_BOTTOM} ` +
                  history.map(point => `L${xPct(point.epoch)},${yPct(point.tick)}`).join(' ') +
                  ` L${xPct(history[history.length - 1].epoch)},${PLOT_BOTTOM} Z`
                : '';

        return {
            path,
            area,
            xPct,
            yPct,
            entry_point:
                entry_epoch && typeof entry_spot === 'number' ? { x: xPct(entry_epoch), y: yPct(entry_spot) } : null,
            exit_point:
                exit_epoch && typeof exit_spot === 'number' ? { x: xPct(exit_epoch), y: yPct(exit_spot) } : null,
            barrier_y: typeof barrier === 'number' ? yPct(barrier) : null,
        };
    }, [ticks, entry_epoch, entry_spot, exit_epoch, exit_spot, barrier]);

    if (!geometry) return null;

    return (
        <div className='contract-chart'>
            <svg className='contract-chart__svg' viewBox='0 0 100 100' preserveAspectRatio='none'>
                {geometry.area && <path d={geometry.area} className='contract-chart__area' />}
                {geometry.barrier_y !== null && (
                    <line x1={0} y1={geometry.barrier_y} x2={100} y2={geometry.barrier_y} className='contract-chart__barrier' />
                )}
                <path d={geometry.path} className='contract-chart__line' vectorEffect='non-scaling-stroke' />
            </svg>

            {geometry.barrier_y !== null && typeof barrier === 'number' && (
                <span className='contract-chart__barrier-label' style={{ top: `${geometry.barrier_y}%` }}>
                    {barrier}
                </span>
            )}

            {geometry.entry_point && (
                <span
                    className='contract-chart__marker contract-chart__marker--entry'
                    style={{ left: `${geometry.entry_point.x}%`, top: `${geometry.entry_point.y}%` }}
                    aria-hidden='true'
                />
            )}

            {geometry.exit_point && (
                <span
                    className={clsx(
                        'contract-chart__marker contract-chart__marker--exit',
                        is_win ? 'contract-chart__marker--win' : 'contract-chart__marker--loss'
                    )}
                    style={{ left: `${geometry.exit_point.x}%`, top: `${geometry.exit_point.y}%` }}
                    aria-hidden='true'
                />
            )}

            <div className='contract-chart__legend'>
                {typeof entry_spot === 'number' && (
                    <div className='contract-chart__legend-item'>
                        <span className='contract-chart__legend-dot contract-chart__legend-dot--entry' aria-hidden='true' />
                        <span className='contract-chart__legend-text'>
                            {entry_spot}
                            {entry_epoch && <span className='contract-chart__legend-time'>{formatTime(entry_epoch, 'HH:mm:ss')}</span>}
                        </span>
                    </div>
                )}
                {typeof exit_spot === 'number' && (
                    <div className='contract-chart__legend-item'>
                        <span
                            className={clsx(
                                'contract-chart__legend-dot',
                                is_win ? 'contract-chart__legend-dot--win' : 'contract-chart__legend-dot--loss'
                            )}
                            aria-hidden='true'
                        />
                        <span className='contract-chart__legend-text'>
                            {exit_spot}
                            {exit_epoch && <span className='contract-chart__legend-time'>{formatTime(exit_epoch, 'HH:mm:ss')}</span>}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContractChart;
