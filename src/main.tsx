import { configure } from 'mobx';
import ReactDOM from 'react-dom/client';
import { AuthWrapper } from './app/AuthWrapper';

import {
    applyBrandFontFromConfig,
    applyDocumentTitle,
    applyFaviconFromLogo,
    applyPrimaryColorFromConfig,
} from './utils/document-branding';
import { performVersionCheck } from './utils/version-check';
// @ts-ignore: SCSS module side-effect import has no type declarations
import './styles/index.scss';

configure({ isolateGlobalState: true });

performVersionCheck();

applyDocumentTitle();
applyFaviconFromLogo();
applyBrandFontFromConfig();
applyPrimaryColorFromConfig();

ReactDOM.createRoot(document.getElementById('root')!).render(<AuthWrapper />);
