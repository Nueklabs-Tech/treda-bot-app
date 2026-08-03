import { fetchUserProfile } from '../user-profile.service';

describe('fetchUserProfile', () => {
    const makeApi = (response: unknown) => ({ send: jest.fn().mockResolvedValue(response) });

    beforeEach(() => {
        jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('requests the account settings from the authenticated socket', async () => {
        const api = makeApi({ get_settings: { first_name: 'Ada', last_name: 'Lovelace' } });

        await fetchUserProfile(api);

        expect(api.send).toHaveBeenCalledWith({ get_settings: 1 });
    });

    it('joins the name parts into a full name', async () => {
        const api = makeApi({
            get_settings: { first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com' },
        });

        await expect(fetchUserProfile(api)).resolves.toEqual({
            fullname: 'Ada Lovelace',
            email: 'ada@example.com',
        });
    });

    it('handles a first name with no surname', async () => {
        const api = makeApi({ get_settings: { first_name: 'Ada', email: 'ada@example.com' } });

        await expect(fetchUserProfile(api)).resolves.toEqual({
            fullname: 'Ada',
            email: 'ada@example.com',
        });
    });

    it('falls back to the fullname field when the parts are absent', async () => {
        const api = makeApi({ get_settings: { fullname: 'Mr Alan Turing', email: 'alan@example.com' } });

        await expect(fetchUserProfile(api)).resolves.toEqual({
            fullname: 'Mr Alan Turing',
            email: 'alan@example.com',
        });
    });

    it('returns the email alone for an account with no name on file', async () => {
        const api = makeApi({ get_settings: { first_name: '', last_name: '', email: 'demo@example.com' } });

        await expect(fetchUserProfile(api)).resolves.toEqual({
            fullname: undefined,
            email: 'demo@example.com',
        });
    });

    it('returns null when the response carries an error', async () => {
        const api = makeApi({ error: { code: 'UnrecognisedRequest', message: 'not supported' } });

        await expect(fetchUserProfile(api)).resolves.toBeNull();
    });

    it('returns null when the settings payload is empty', async () => {
        const api = makeApi({ get_settings: {} });

        await expect(fetchUserProfile(api)).resolves.toBeNull();
    });

    it('swallows a rejected request so authorization is never blocked', async () => {
        const api = { send: jest.fn().mockRejectedValue(new Error('socket closed')) };

        await expect(fetchUserProfile(api)).resolves.toBeNull();
    });

    it('returns null without calling out when there is no api instance', async () => {
        await expect(fetchUserProfile(null)).resolves.toBeNull();
    });
});
