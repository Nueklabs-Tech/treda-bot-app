import { getOAuthRedirectPath, getOAuthRedirectUri } from '../oauth-redirect';

// Every case here is a value the provider would reject with
// "the 'redirect_uri' parameter does not match any of the OAuth 2.0 Client's
// pre-registered redirect urls", which is an authorization-endpoint error — the
// user never gets redirected back, so nothing downstream can recover from it.
describe('getOAuthRedirectUri', () => {
    const original = process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI;

    afterEach(() => {
        process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI = original;
    });

    it('returns the configured URI unchanged when it is already clean', () => {
        process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI = 'https://app.example.com';
        expect(getOAuthRedirectUri()).toBe('https://app.example.com');
    });

    it('drops a trailing slash on a bare origin', () => {
        process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI = 'https://app.example.com/';
        expect(getOAuthRedirectUri()).toBe('https://app.example.com');
    });

    it('strips surrounding quotes left by a shell that does not unquote', () => {
        process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI = '"https://app.example.com"';
        expect(getOAuthRedirectUri()).toBe('https://app.example.com');
    });

    it('strips stray whitespace and trailing newlines', () => {
        process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI = '  https://app.example.com\n';
        expect(getOAuthRedirectUri()).toBe('https://app.example.com');
    });

    it('keeps a real path but drops its trailing slash', () => {
        process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI = 'https://app.example.com/callback/';
        expect(getOAuthRedirectUri()).toBe('https://app.example.com/callback');
    });

    it('preserves a path exactly when it has no trailing slash', () => {
        process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI = 'https://app.example.com/callback';
        expect(getOAuthRedirectUri()).toBe('https://app.example.com/callback');
    });

    it('falls back to the current origin when unset', () => {
        delete process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI;
        expect(getOAuthRedirectUri()).toBe(window.location.origin);
    });

    it('falls back to the current origin when set to an empty or blank value', () => {
        process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI = '   ';
        expect(getOAuthRedirectUri()).toBe(window.location.origin);
    });

    it('passes an unparseable value through rather than guessing at a fix', () => {
        process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI = 'not a url';
        expect(getOAuthRedirectUri()).toBe('not a url');
    });
});

describe('getOAuthRedirectPath', () => {
    const original = process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI;

    afterEach(() => {
        process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI = original;
    });

    it('is "/" for a bare origin', () => {
        process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI = 'https://app.example.com';
        expect(getOAuthRedirectPath()).toBe('/');
    });

    it('returns the path of a dedicated callback URI', () => {
        process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI = 'https://app.example.com/callback';
        expect(getOAuthRedirectPath()).toBe('/callback');
    });

    it('returns "/" for an unparseable value', () => {
        process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI = 'not a url';
        expect(getOAuthRedirectPath()).toBe('/');
    });
});
