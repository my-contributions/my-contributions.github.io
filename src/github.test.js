import 'whatwg-fetch';
import {fetchPullRequests} from './github';

beforeAll(() => {
    global.fetch = jest.fn();
});

it('handles HTTP errors', async () => {
    global.fetch.mockReturnValueOnce({ ok: false });
    expect.assertions(1);

    const error = new Error('Error fetching pull requests');
    await expect(fetchPullRequests('test')).rejects.toEqual(error);
});

it('returns object', async () => {
    global.fetch.mockReturnValueOnce(new Response('{}', { status: 200 }));
    expect.assertions(1);

    await expect(fetchPullRequests('test')).resolves.toEqual({});
});

it('tests author', async () => {
    expect.assertions(2);

    const error = new Error('Invalid author');
    await expect(fetchPullRequests('test:')).rejects.toEqual(error);
    await expect(fetchPullRequests(' test')).rejects.toEqual(error);
});