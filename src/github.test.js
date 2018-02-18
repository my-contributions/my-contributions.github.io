import 'whatwg-fetch';
import aggregatePullRequests from './github';

beforeAll(() => {
    window.fetch = jest.fn();
});

function mockResponse(body, headers = {}) {
    return new window.Response(
        JSON.stringify(body),
        {
            status: 200,
            headers: headers,
        },
    );
}

describe('aggregatePullRequests', () => {
    it('handles HTTP errors', async () => {
        window.fetch.mockReturnValueOnce({ ok: false });

        const error = new Error('Error fetching https://api.github.com/search/issues?per_page=100&q=type%3Apr%20author%3Atest');
        await expect(aggregatePullRequests('test')).rejects.toEqual(error);
    });

    it('tests author', async () => {
        const error = new Error('Invalid author');
        await expect(aggregatePullRequests('test:')).rejects.toEqual(error);
        await expect(aggregatePullRequests(' test')).rejects.toEqual(error);
    });

    it('handles pagination errors', async () => {
        window.fetch.mockReturnValueOnce(mockResponse({}, {'Link': 'error'}));

        const error = new Error('Pagination error');
        await expect(aggregatePullRequests('test')).rejects.toEqual(error);
    });

    it('fetches pages', async () => {
        window.fetch.mockImplementation((url) => {
            switch (url) {
            case 'https://api.github.com/search/issues?per_page=100&q=type%3Apr%20author%3Atest':
                return mockResponse({items: [
                    {
                        repository_url: 'https://api.github.com/repos/user/repo1',
                        state: 'open',
                    },
                ]}, {
                    'Link':
                        '<https://api.github.com/search/issues?per_page=100&q=type%3Apr%20author%3Atest&page=2>;' +
                        ' rel="next", ' +
                        '<https://api.github.com/search/issues?per_page=100&q=type%3Apr%20author%3Atest&page=2>;' +
                        ' rel="last',
                });
            case 'https://api.github.com/search/issues?per_page=100&q=type%3Apr%20author%3Atest&page=2':
                return mockResponse({items: [
                    {
                        repository_url: 'https://api.github.com/repos/user/repo1',
                        state: 'closed',
                    },
                ]}, {
                    'Link':
                        '<https://api.github.com/search/issues?per_page=100&q=type%3Apr%20author%3Atest&page=1>;' +
                        ' rel="prev", ' +
                        '<https://api.github.com/search/issues?per_page=100&q=type%3Apr%20author%3Atest&page=1>;' +
                        ' rel="first"',
                });
            case 'https://api.github.com/repos/user/repo1':
                return mockResponse({
                    html_url: 'https://github.com/user/repo1',
                    full_name: 'Repo 1',
                    stargazers_count: 1,
                    language: 'JavaScript',
                });
            default:
                return { ok: false };
            }
        });

        const result = [
            {
                repository: {
                    html_url: 'https://github.com/user/repo1',
                    full_name: 'Repo 1',
                    stargazers_count: 1,
                    language: 'JavaScript',
                },
                open: 1,
                closed: 1,
                html_url: 'https://github.com/search?utf8=✓&q=type%3Apr%20author%3Atest%20repo%3ARepo%201',
            },
        ];

        await expect(aggregatePullRequests('test')).resolves.toEqual(result);
    });

    it('aggregates', async () => {
        window.fetch.mockImplementation((url) => {
            switch (url) {
            case 'https://api.github.com/search/issues?per_page=100&q=type%3Apr%20author%3Atest':
                return mockResponse({items: [
                    {
                        repository_url: 'https://api.github.com/repos/user/repo1',
                        state: 'open',
                    },
                    {
                        repository_url: 'https://api.github.com/repos/user/repo1',
                        state: 'closed',
                    },
                    {
                        repository_url: 'https://api.github.com/repos/user/repo1',
                        state: 'closed',
                    },
                    {
                        repository_url: 'https://api.github.com/repos/user/repo2',
                        state: 'open',
                    },
                    {
                        repository_url: 'https://api.github.com/repos/user/repo2',
                        state: 'open',
                    },
                    {
                        repository_url: 'https://api.github.com/repos/user/repo3',
                        state: 'closed',
                    },
                    {
                        repository_url: 'https://api.github.com/repos/user/repo3',
                        state: 'closed',
                    },
                ]});
            case 'https://api.github.com/repos/user/repo1':
                return mockResponse({
                    html_url: 'https://github.com/user/repo1',
                    full_name: 'Repo 1',
                    stargazers_count: 1,
                    language: 'JavaScript',
                });
            case 'https://api.github.com/repos/user/repo2':
                return mockResponse({
                    html_url: 'https://github.com/user/repo2',
                    full_name: 'Repo 2',
                    stargazers_count: 3,
                    language: 'Python',
                });
            case 'https://api.github.com/repos/user/repo3':
                return mockResponse({
                    html_url: 'https://github.com/user/repo3',
                    full_name: 'Repo 3',
                    stargazers_count: 2,
                    language: 'Go',
                });
            default:
                return { ok: false };
            }
        });

        const result = [
            {
                repository: {
                    html_url: 'https://github.com/user/repo1',
                    full_name: 'Repo 1',
                    stargazers_count: 1,
                    language: 'JavaScript',
                },
                open: 1,
                closed: 2,
                html_url: 'https://github.com/search?utf8=✓&q=type%3Apr%20author%3Atest%20repo%3ARepo%201',
            },
            {
                repository: {
                    html_url: 'https://github.com/user/repo2',
                    full_name: 'Repo 2',
                    stargazers_count: 3,
                    language: 'Python',
                },
                open: 2,
                closed: 0,
                html_url: 'https://github.com/search?utf8=✓&q=type%3Apr%20author%3Atest%20repo%3ARepo%202',
            },
            {
                repository: {
                    html_url: 'https://github.com/user/repo3',
                    full_name: 'Repo 3',
                    stargazers_count: 2,
                    language: 'Go',
                },
                open: 0,
                closed: 2,
                html_url: 'https://github.com/search?utf8=✓&q=type%3Apr%20author%3Atest%20repo%3ARepo%203',
            },
        ];

        await expect(aggregatePullRequests('test')).resolves.toEqual(result);
    });
});