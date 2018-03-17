import 'whatwg-fetch';
import {fetchJSON} from './utils';

beforeAll(() => {
    window.fetch = jest.fn();
});

beforeEach(() => {
    window.fetch.mockReset();
});

describe('fetchJSON', () => {
    it('handles HTTP errors', async () => {
        window.fetch.mockReturnValueOnce({ok: false});

        const url = 'http://exmaple.com';
        const error = new Error('Could not fetch ' + url);

        await expect(fetchJSON(url)).rejects.toEqual(error);
    });

    it('adds Accept header', async () => {
        window.fetch.mockReturnValueOnce({ok: false});

        const url = 'http://exmaple.com';
        const init = {method: 'POST'};
        const jsonInit = Object.assign({headers: {Accept: 'application/json'}}, init);
        const error = new Error('Could not fetch ' + url);

        await expect(fetchJSON(url, init)).rejects.toEqual(error);
        expect(window.fetch).toHaveBeenCalledWith(url, jsonInit);
    });
});