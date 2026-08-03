// @ts-ignore: side-effect SCSS import has no type declarations
import './circle-loader.scss';

type TCircleLoaderProps = {
    /** Optional status line under the ring. */
    message?: string;
    /** Ring diameter in px. */
    size?: number;
    /** Fill the parent and centre the ring (default). Set false to drop it inline. */
    is_fullscreen?: boolean;
};

/**
 * Lightweight circular spinner for in-app waits — chunk loads, route
 * transitions, anything that is not the first paint of the app.
 *
 * The branded <AppLoading /> constellation is the homepage boot screen; using it
 * for a chunk that resolves in a few hundred milliseconds reads as a full app
 * restart, so deeper routes use this instead.
 */
const CircleLoader = ({ message, size = 48, is_fullscreen = true }: TCircleLoaderProps) => (
    <div
        className={`circle-loader${is_fullscreen ? ' circle-loader--fullscreen' : ''}`}
        role='status'
        aria-live='polite'
        aria-busy='true'
    >
        <span
            className='circle-loader__ring'
            style={{ width: size, height: size, borderWidth: Math.max(2, Math.round(size / 12)) }}
            aria-hidden='true'
        />
        {message ? <span className='circle-loader__message'>{message}</span> : null}
    </div>
);

export default CircleLoader;
