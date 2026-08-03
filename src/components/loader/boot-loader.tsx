import { isHomepage } from '@/utils/is-homepage';
import { localize } from '@deriv-com/translations';
import AppLoading from './app-loading';
import CircleLoader from './circle-loader';

type TBootLoaderProps = {
    /** Status line. Falls back to each loader's own default. */
    message?: string;
};

/**
 * Full-screen wait that picks its skin from the URL: the branded
 * <AppLoading /> constellation belongs to the homepage ('/'), while every other
 * route — /profile, the OAuth callback — gets the plain <CircleLoader />, which
 * does not read as the whole app restarting.
 */
const BootLoader = ({ message }: TBootLoaderProps) =>
    isHomepage() ? <AppLoading message={message} /> : <CircleLoader message={message ?? localize('Loading')} />;

export default BootLoader;
