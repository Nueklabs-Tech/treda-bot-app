import { useEffect } from 'react';
import { FILTERED_LANGUAGES } from '@/utils/languages';
import { useTranslations } from '@deriv-com/translations';

export const useLanguageFromURL = () => {
    const { switchLanguage } = useTranslations();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        let langParam = urlParams.get('lang');

        if (!langParam) {
            const storedLang = localStorage.getItem('i18n_language');
            if (storedLang) {
                try {
                    langParam = JSON.parse(storedLang);
                } catch {
                    langParam = storedLang;
                }
            }
        }

        if (langParam) {
            const langCodeCandidate = langParam.toUpperCase();

            const supportedLangCodes = FILTERED_LANGUAGES.map(lang => lang.code);

            if (!supportedLangCodes.includes(langCodeCandidate)) {
                try {
                    switchLanguage('EN');
                    const url = new URL(window.location.href);
                    url.searchParams.delete('lang');
                    window.history.replaceState({}, '', url.toString());
                } catch (error) {
                    console.error('Failed to switch language:', error);
                }
                return;
            }

            const langCode = langCodeCandidate as (typeof FILTERED_LANGUAGES)[number]['code'];
            try {
                switchLanguage(langCode);
                const url = new URL(window.location.href);
                url.searchParams.delete('lang');
                window.history.replaceState({}, '', url.toString());
            } catch (error) {
                console.error('Failed to switch language:', error);
            }
        }
    }, [switchLanguage]);
};
