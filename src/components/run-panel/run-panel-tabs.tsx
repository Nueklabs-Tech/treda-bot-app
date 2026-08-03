import Journal from '@/components/journal';
import Tabs from '@/components/shared_ui/tabs';
import Summary from '@/components/summary';
import Transactions from '@/components/transactions';
import { Localize } from '@deriv-com/translations';

type TRunPanelTabsProps = {
    /** Tab on show. Comes from `run_panel` so the drawer and the page agree. */
    active_index: number;
    setActiveTabIndex: (index: number) => void;
    /**
     * Drawer-only layout flag: Summary and Transactions use it to switch to their
     * mobile sizing. The /positions page sizes them itself, so it leaves it off.
     */
    is_drawer_open?: boolean;
};

/**
 * Summary / Transactions / Journal — the three views of a bot run, shared by the
 * run-panel drawer and the /positions page so the two can never drift apart.
 *
 * The tab element ids are load-bearing: the product tours and the vendored
 * `run_panel` store address them by id, so keep them as they are.
 */
const RunPanelTabs = ({ active_index, setActiveTabIndex, is_drawer_open = false }: TRunPanelTabsProps) => (
    <Tabs active_index={active_index} onTabItemClick={setActiveTabIndex} top>
        <div id='db-run-panel-tab__summary' label={<Localize i18n_default_text='Summary' />}>
            <Summary is_drawer_open={is_drawer_open} />
        </div>
        <div id='db-run-panel-tab__transactions' label={<Localize i18n_default_text='Transactions' />}>
            <Transactions is_drawer_open={is_drawer_open} />
        </div>
        <div id='db-run-panel-tab__journal' label={<Localize i18n_default_text='Journal' />}>
            <Journal />
        </div>
    </Tabs>
);

export default RunPanelTabs;
