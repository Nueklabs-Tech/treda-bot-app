import RectangleSkeleton from '@/components/loader/rectangle-skeleton';
import { localize } from '@deriv-com/translations';
// @ts-ignore: Allow side-effect import of SCSS without type declarations
import './contract-details-skeleton.scss';

const ORDER_DETAIL_ROW_IDS = ['reference-id', 'duration', 'barrier'];
const ENTRY_EXIT_ROW_IDS = ['start-time', 'entry-spot', 'exit-time', 'exit-spot'];

const SkeletonRow = () => (
    <div className='contract-details-skeleton__row'>
        <RectangleSkeleton width='9rem' height='1.4rem' />
        <RectangleSkeleton width='6rem' height='1.4rem' />
    </div>
);

/**
 * Traces the shape contract-details.tsx settles into — summary card, chart,
 * two detail sections — so the page holds its geometry while `useOpenContract`
 * waits on its first `proposal_open_contract` response instead of jumping from
 * a caption to a full layout.
 */
const ContractDetailsSkeleton = () => (
    <div className='contract-details-skeleton' role='status' aria-live='polite' aria-busy='true'>
        <span className='contract-details-skeleton__sr-only'>{localize('Loading contract…')}</span>

        <div className='contract-details-skeleton__card'>
            <div className='contract-details-skeleton__card-top'>
                <RectangleSkeleton width='2.4rem' height='2.4rem' />
                <div className='contract-details-skeleton__card-info'>
                    <RectangleSkeleton width='14rem' height='1.5rem' />
                    <RectangleSkeleton width='6rem' height='1.3rem' />
                </div>
                <div className='contract-details-skeleton__card-side'>
                    <RectangleSkeleton width='2.4rem' height='2.4rem' />
                    <RectangleSkeleton width='6rem' height='1.4rem' />
                </div>
            </div>
            <div className='contract-details-skeleton__card-bottom'>
                <RectangleSkeleton width='8rem' height='2.4rem' />
                <RectangleSkeleton width='6rem' height='1.5rem' />
            </div>
        </div>

        <div className='contract-details-skeleton__card'>
            <RectangleSkeleton width='100%' height='22rem' />
            <div className='contract-details-skeleton__card-bottom'>
                <RectangleSkeleton width='10rem' height='1.5rem' />
                <RectangleSkeleton width='10rem' height='1.5rem' />
            </div>
        </div>

        <div className='contract-details-skeleton__card'>
            <RectangleSkeleton width='10rem' height='1.5rem' />
            {ORDER_DETAIL_ROW_IDS.map(id => (
                <SkeletonRow key={id} />
            ))}
        </div>

        <div className='contract-details-skeleton__card'>
            <RectangleSkeleton width='13rem' height='1.5rem' />
            {ENTRY_EXIT_ROW_IDS.map(id => (
                <SkeletonRow key={id} />
            ))}
        </div>
    </div>
);

export default ContractDetailsSkeleton;
