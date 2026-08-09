import { isHomepage } from '@/utils/is-homepage';
import { localize } from '@deriv-com/translations';
import AppLoading from './app-loading';
import SkeletonLoader from './skeleton-loader';

type TBootLoaderProps = {
    message?: string;
};

const BootLoader = ({ message }: TBootLoaderProps) =>
    isHomepage() ? <AppLoading message={message} /> : <SkeletonLoader message={message ?? localize('Loading')} />;

export default BootLoader;
