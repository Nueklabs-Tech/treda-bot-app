// Removed unused React import - React 17+ JSX transform doesn't require it
import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '@/hooks/useStore';
import Chart from './chart';
import './chart.scss';

interface ChartWrapperProps {
    prefix?: string;
    show_digits_stats: boolean;
    /** Passed through to <Chart />; the trade screen supplies its own header. */
    show_top_widgets?: boolean;
}

const ChartWrapper = observer(({ prefix = 'chart', show_digits_stats, show_top_widgets }: ChartWrapperProps) => {
    const { client } = useStore();
    const [uuid] = useState(uuidv4());

    const uniqueKey = client.loginid ? `${prefix}-${client.loginid}` : `${prefix}-${uuid}`;

    return <Chart key={uniqueKey} show_digits_stats={show_digits_stats} show_top_widgets={show_top_widgets} />;
});

export default ChartWrapper;
