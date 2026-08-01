import { type MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { generateOAuthURL } from '@/components/shared';
import { useApiBase } from '@/hooks/useApiBase';
import { getAppName } from '@/utils/branding';
import { LegacyWarningIcon } from '@deriv/quill-icons/Legacy';
import { Localize, localize } from '@deriv-com/translations';
// @ts-ignore: Allow side-effect import of SCSS without type declarations
import './welcome.scss';

// All copy is built inside functions so the strings resolve after i18n is initialised.

const getFeatures = () => [
    {
        title: localize('Build without code'),
        description: localize('Drag and drop blocks to turn a trading idea into a running strategy.'),
    },
    {
        title: localize('Free bot library'),
        description: localize('Start from ready-made strategies and adjust them to fit your own rules.'),
    },
    {
        title: localize('Test before you risk'),
        description: localize('Run your bot on a demo account and review every trade in the journal.'),
    },
    {
        title: localize('Trade around the clock'),
        description: localize('Your strategy keeps watching the markets while you step away.'),
    },
    {
        title: localize('Live charts and indicators'),
        description: localize('Follow price action with charts and technical indicators built in.'),
    },
    {
        title: localize('Full trade journal'),
        description: localize('Every run is logged, so you can see exactly why each trade happened.'),
    },
];

// A real sequence — numbering carries meaning here.
const getSteps = () => [
    {
        title: localize('Create a free account'),
        description: localize('Sign up in minutes and start on a demo balance with virtual funds.'),
    },
    {
        title: localize('Pick or build a bot'),
        description: localize('Load a strategy from the library, or assemble your own with blocks.'),
    },
    {
        title: localize('Test, refine, then go live'),
        description: localize('Run it on demo, check the journal, and switch to a real account when ready.'),
    },
];

const getMarkets = () => [
    localize('Volatility indices'),
    localize('Boom and Crash'),
    localize('Step indices'),
    localize('Jump indices'),
    localize('Range Break'),
    localize('Bear and Bull Market'),
];

const getFaqs = () => [
    {
        question: localize('Do I need to know how to code?'),
        answer: localize(
            'No. Strategies are built visually with drag-and-drop blocks. If you can describe your rules, you can build them.'
        ),
    },
    {
        question: localize('Is it free to use?'),
        answer: localize(
            'Yes. The bot builder, strategy library, and demo trading are free. You only fund an account if you choose to trade with real money.'
        ),
    },
    {
        question: localize('Can I try it without risking money?'),
        answer: localize(
            'Yes. Every account starts with a demo balance of virtual funds, so you can test any strategy before going live.'
        ),
    },
    {
        question: localize('Which markets can I automate?'),
        answer: localize(
            'Synthetic indices such as Volatility, Boom and Crash, Step, Jump, and Range Break — available to trade 24/7.'
        ),
    },
];

const Welcome = () => {
    const { setIsAuthorizing } = useApiBase();
    const [pending_action, setPendingAction] = useState<'login' | 'signup' | null>(null);
    const [is_disclaimer_open, setIsDisclaimerOpen] = useState(false);

    // A native <dialog> is used so the browser handles the top layer, the
    // backdrop, focus trapping, and Esc-to-close for us.
    const disclaimer_ref = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = disclaimer_ref.current;
        if (!dialog) return;

        if (is_disclaimer_open && !dialog.open) {
            dialog.showModal();
        } else if (!is_disclaimer_open && dialog.open) {
            dialog.close();
        }
    }, [is_disclaimer_open]);

    // The content sits in its own wrapper, so a click that lands on the dialog
    // itself came from the backdrop.
    const onDialogClick = useCallback((event: MouseEvent<HTMLDialogElement>) => {
        if (event.target === disclaimer_ref.current) setIsDisclaimerOpen(false);
    }, []);

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

            <section className='welcome__stats' aria-label={localize('Highlights')}>
                <div className='welcome__stat'>
                    <span className='welcome__stat-value'>
                        <Localize i18n_default_text='Free' />
                    </span>
                    <span className='welcome__stat-label'>
                        <Localize i18n_default_text='Bot builder and library' />
                    </span>
                </div>
                <div className='welcome__stat'>
                    <span className='welcome__stat-value'>24/7</span>
                    <span className='welcome__stat-label'>
                        <Localize i18n_default_text='Synthetic markets' />
                    </span>
                </div>
                <div className='welcome__stat'>
                    <span className='welcome__stat-value'>
                        <Localize i18n_default_text='Demo first' />
                    </span>
                    <span className='welcome__stat-label'>
                        <Localize i18n_default_text='Test with virtual funds' />
                    </span>
                </div>
                <div className='welcome__stat'>
                    <span className='welcome__stat-value'>50+</span>
                    <span className='welcome__stat-label'>
                        <Localize i18n_default_text='Chart indicators' />
                    </span>
                </div>
            </section>

            <section className='welcome__section'>
                <h2 className='welcome__section-title'>
                    <Localize i18n_default_text='Everything you need in one workspace' />
                </h2>
                <div className='welcome__features'>
                    {getFeatures().map(feature => (
                        <article key={feature.title} className='welcome__feature'>
                            <h3 className='welcome__feature-title'>{feature.title}</h3>
                            <p className='welcome__feature-text'>{feature.description}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className='welcome__section'>
                <h2 className='welcome__section-title'>
                    <Localize i18n_default_text='How it works' />
                </h2>
                <ol className='welcome__steps'>
                    {getSteps().map((step, index) => (
                        <li key={step.title} className='welcome__step'>
                            <span className='welcome__step-number' aria-hidden='true'>
                                {index + 1}
                            </span>
                            <h3 className='welcome__step-title'>{step.title}</h3>
                            <p className='welcome__step-text'>{step.description}</p>
                        </li>
                    ))}
                </ol>
            </section>

            <section className='welcome__section'>
                <h2 className='welcome__section-title'>
                    <Localize i18n_default_text='Markets you can automate' />
                </h2>
                <p className='welcome__section-subtitle'>
                    <Localize i18n_default_text='Synthetic indices run around the clock — no opening hours, no gaps.' />
                </p>
                <ul className='welcome__markets'>
                    {getMarkets().map(market => (
                        <li key={market} className='welcome__market'>
                            {market}
                        </li>
                    ))}
                </ul>
            </section>

            <section className='welcome__section'>
                <h2 className='welcome__section-title'>
                    <Localize i18n_default_text='Frequently asked questions' />
                </h2>
                <div className='welcome__faqs'>
                    {getFaqs().map(faq => (
                        <details key={faq.question} className='welcome__faq'>
                            <summary className='welcome__faq-question'>{faq.question}</summary>
                            <p className='welcome__faq-answer'>{faq.answer}</p>
                        </details>
                    ))}
                </div>
            </section>

            <section className='welcome__cta'>
                <h2 className='welcome__cta-title'>
                    <Localize i18n_default_text='Ready to build your first bot?' />
                </h2>
                <p className='welcome__cta-text'>
                    <Localize i18n_default_text='Start on a demo balance — it takes a few minutes and costs nothing.' />
                </p>
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
            </section>

            <section className='welcome__disclaimer'>
                <button
                    type='button'
                    className='welcome__disclaimer-trigger'
                    onClick={() => setIsDisclaimerOpen(true)}
                    aria-haspopup='dialog'
                >
                    {/* Decorative — the button text already carries the meaning. */}
                    <LegacyWarningIcon
                        className='welcome__disclaimer-icon'
                        iconSize='xs'
                        fill='currentColor'
                        aria-hidden='true'
                    />
                    <Localize i18n_default_text='Risk disclaimer' />
                </button>
            </section>

            <dialog
                ref={disclaimer_ref}
                className='welcome__modal'
                aria-labelledby='welcome_disclaimer_title'
                onClose={() => setIsDisclaimerOpen(false)}
                onClick={onDialogClick}
            >
                <div className='welcome__modal-content'>
                    <header className='welcome__modal-header'>
                        <h2 id='welcome_disclaimer_title' className='welcome__modal-title'>
                            <LegacyWarningIcon
                                className='welcome__modal-title-icon'
                                iconSize='sm'
                                fill='currentColor'
                                aria-hidden='true'
                            />
                            <Localize i18n_default_text='Risk disclaimer' />
                        </h2>
                        <button
                            type='button'
                            className='welcome__modal-close'
                            onClick={() => setIsDisclaimerOpen(false)}
                            aria-label={localize('Close')}
                        >
                            &times;
                        </button>
                    </header>

                    <p className='welcome__modal-text'>
                        <Localize i18n_default_text='Deriv offers complex derivatives such as options and contracts for difference ("CFDs"). These products may not be suitable for all clients, and trading them puts you at risk. You may lose some or all of the money you invest, and exchange rates may affect your profit and loss. Never trade with borrowed money or with money you cannot afford to lose.' />
                    </p>

                    <p className='welcome__modal-text'>
                        <Localize i18n_default_text='Automated strategies place trades on your behalf and do not guarantee a profit. Test every bot on a demo account first, and keep monitoring it once it runs on real funds.' />
                    </p>

                    <button
                        type='button'
                        className='welcome__btn welcome__btn--primary'
                        onClick={() => setIsDisclaimerOpen(false)}
                    >
                        <Localize i18n_default_text='I understand' />
                    </button>
                </div>
            </dialog>
        </main>
    );
};

export default Welcome;
