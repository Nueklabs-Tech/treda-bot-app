import { useCallback, useState } from 'react';
import { generateOAuthURL } from '@/components/shared';
import { useApiBase } from '@/hooks/useApiBase';
import { getAppName } from '@/utils/branding';
import { Localize, localize } from '@deriv-com/translations';
// @ts-ignore: Allow side-effect import of SCSS without type declarations
import './welcome.scss';

// Built inside the component so the strings resolve after i18n is initialised.
const getFeatures = () => [
    {
        title: localize('Build without code'),
        description: localize('Drag and drop blocks to turn a trading idea into a running strategy.'),
    },
    {
        title: localize('Test before you risk'),
        description: localize('Run your bot on a demo account and review every trade in the journal.'),
    },
    {
        title: localize('Trade around the clock'),
        description: localize('Your strategy keeps watching the markets while you step away.'),
    },
];

const Welcome = () => {
    const { setIsAuthorizing } = useApiBase();
    const [pending_action, setPendingAction] = useState<'login' | 'signup' | null>(null);

    const redirectToOAuth = useCallback(
        async (action: 'login' | 'signup') => {
            try {
                setPendingAction(action);
                setIsAuthorizing(true);

                const oauth_url = await generateOAuthURL(action === 'signup' ? 'registration' : undefined);

                if (oauth_url) {
                    window.location.replace(oauth_url);
                    return;
                }

                console.error('Failed to generate OAuth URL');
            } catch (error) {
                console.error('OAuth redirection failed:', error);
            }

            // Only reached when the redirect did not happen — release the UI.
            setIsAuthorizing(false);
            setPendingAction(null);
        },
        [setIsAuthorizing]
    );

    const app_name = getAppName();
    const is_busy = pending_action !== null;

    return (
        <main className='welcome' data-testid='dt_welcome_page'>
            <div className='welcome__glow' aria-hidden='true' />

            <section className='welcome__hero'>
                <img className='welcome__logo' src='/assets/logo/badrobot.png' alt='' />

                <p className='welcome__eyebrow'>
                    <Localize i18n_default_text='Automated trading, made simple' />
                </p>

                <h1 className='welcome__title'>
                    <Localize i18n_default_text='Welcome to {{app_name}}' values={{ app_name }} />
                </h1>

                <p className='welcome__subtitle'>
                    <Localize i18n_default_text='Create, test, and run trading bots — no coding required. Log in to open your dashboard, or create an account to start on a demo balance.' />
                </p>

                <div className='welcome__actions'>
                    <button
                        type='button'
                        className='welcome__btn welcome__btn--primary'
                        onClick={() => redirectToOAuth('signup')}
                        disabled={is_busy}
                    >
                        {pending_action === 'signup' ? (
                            <Localize i18n_default_text='Redirecting…' />
                        ) : (
                            <Localize i18n_default_text='Create free account' />
                        )}
                    </button>

                    <button
                        type='button'
                        className='welcome__btn welcome__btn--secondary'
                        onClick={() => redirectToOAuth('login')}
                        disabled={is_busy}
                    >
                        {pending_action === 'login' ? (
                            <Localize i18n_default_text='Redirecting…' />
                        ) : (
                            <Localize i18n_default_text='Log in' />
                        )}
                    </button>
                </div>

                <p className='welcome__note'>
                    <Localize i18n_default_text='Practise with virtual funds first. Trading involves risk.' />
                </p>
            </section>

            <section className='welcome__features'>
                {getFeatures().map(feature => (
                    <article key={feature.title} className='welcome__feature'>
                        <h2 className='welcome__feature-title'>{feature.title}</h2>
                        <p className='welcome__feature-text'>{feature.description}</p>
                    </article>
                ))}
            </section>
        </main>
    );
};

export default Welcome;
