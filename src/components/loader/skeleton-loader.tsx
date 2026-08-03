// @ts-ignore: side-effect SCSS import has no type declarations
import './skeleton-loader.scss';

type TSkeletonLoaderProps = {
    /** Status line, announced to screen readers rather than drawn. */
    message?: string;
    /** Fill the parent and stretch to its height (default). Set false to drop it inline. */
    is_fullscreen?: boolean;
    /** Placeholder text lines under the cards. */
    lines?: number;
};

/**
 * Layout-shaped placeholder for in-app waits — chunk loads, route transitions,
 * anything that is not the first paint of the app.
 *
 * It traces the shell the incoming screen will occupy (header row, hero panel,
 * card row, text lines) so the page keeps its geometry while the chunk resolves
 * instead of collapsing to a spinner and jumping back. The message is exposed
 * only to assistive tech: a skeleton reads as "this screen is arriving", and a
 * caption on top of it reads as an interruption.
 *
 * The branded <AppLoading /> constellation stays the homepage boot screen.
 */
const SkeletonLoader = ({ message, is_fullscreen = true, lines = 3 }: TSkeletonLoaderProps) => (
    <div
        className={`skeleton-loader${is_fullscreen ? ' skeleton-loader--fullscreen' : ''}`}
        role='status'
        aria-live='polite'
        aria-busy='true'
    >
        <div className='skeleton-loader__header' aria-hidden='true'>
            <span className='skeleton-loader__block skeleton-loader__logo' />
            <span className='skeleton-loader__block skeleton-loader__chip' />
        </div>

        <div className='skeleton-loader__body' aria-hidden='true'>
            <span className='skeleton-loader__block skeleton-loader__hero' />

            <div className='skeleton-loader__cards'>
                <span className='skeleton-loader__block skeleton-loader__card' />
                <span className='skeleton-loader__block skeleton-loader__card' />
                <span className='skeleton-loader__block skeleton-loader__card' />
            </div>

            <div className='skeleton-loader__lines'>
                {Array.from({ length: Math.max(0, lines) }, (_, index) => (
                    <span key={index} className='skeleton-loader__block skeleton-loader__line' />
                ))}
            </div>
        </div>

        {message ? <span className='skeleton-loader__message'>{message}</span> : null}
    </div>
);

export default SkeletonLoader;
