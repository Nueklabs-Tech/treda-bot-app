// @ts-ignore: Allow side-effect import of SCSS without type declarations
import './app-loading.scss';

type TAppLoadingProps = {
    message?: string;
};

/**
 * Minimal loading state for the app shell. Deliberately lightweight — it
 * replaces the heavier animated chunk loader that used to cover the screen.
 */
const AppLoading = ({ message }: TAppLoadingProps) => (
    <div className='app-loading' role='status' aria-live='polite'>
        <span className='app-loading__spinner' aria-hidden='true' />
        {message ? <span className='app-loading__message'>{message}</span> : null}
    </div>
);

export default AppLoading;
