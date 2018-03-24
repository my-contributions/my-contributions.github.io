import 'whatwg-fetch';
import GitHub from './GitHub';

const paramsGetMock = jest.fn();
const paramsDeleteMock = jest.fn();

let github;

beforeAll(() => {
    window.fetch = jest.fn();

    Object.defineProperty(window, 'localStorage', {
        value: {
            setItem: jest.fn(),
            getItem: jest.fn(),
            removeItem: jest.fn(),
        },
    });

    Object.defineProperty(window.location, 'replace', {
        value: jest.fn(),
    });

    Object.defineProperty(window, 'URL', {
        value: class {
            get searchParams() {
                return {
                    get: paramsGetMock,
                    delete: paramsDeleteMock,
                };
            }
        },
    });

    Object.defineProperty(window, 'crypto', {
        value: {
            getRandomValues: (bytes) => {
                for (let i = 0, length = bytes.length; i < length; i++) {
                    bytes[i] = 33;
                }
            },
        },
    });
});

beforeEach(() => {
    github = new GitHub('test');
});

afterEach(() => {
    window.fetch.mockReset();

    window.localStorage.setItem.mockReset();
    window.localStorage.getItem.mockReset();
    window.localStorage.removeItem.mockReset();

    window.location.replace.mockReset();

    paramsGetMock.mockReset();
    paramsDeleteMock.mockReset();
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

describe('constructor', () => {
    it('validates author', () => {
        function authorWithSpace() {
            new GitHub(' author');
        }

        function authorWithColon() {
            new GitHub('aut:hor');
        }
        
        expect(authorWithSpace).toThrow('Invalid author');
        expect(authorWithColon).toThrow('Invalid author');
    });
});

describe('aggregatePullRequests', () => {
    it('handles HTTP errors', async () => {
        window.fetch.mockReturnValueOnce({ok: false});

        const error = new Error(
            'Could not fetch https://api.github.com/search/issues?per_page=100&q=type%3Apr%20author%3Atest'
        );
        await expect(github.aggregatePullRequests()).rejects.toEqual(error);
    });

    it('requests authorization if 401 Unauthorized', async () => {
        github._authorization = 'token';
        window.fetch.mockReturnValueOnce({status: 401});

        await expect(github.aggregatePullRequests()).resolves.toEqual(null);
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('access_token');
    });

    it('uses authorization header', async () => {
        github._authorization = 'token';
        window.fetch.mockReturnValueOnce(mockResponse({items: []}));

        await expect(github.aggregatePullRequests()).resolves.toEqual([]);
    });

    it('handles pagination errors', async () => {
        window.fetch.mockReturnValueOnce(mockResponse({}, {'Link': 'error'}));

        const error = new Error('Pagination error');
        await expect(github.aggregatePullRequests()).rejects.toEqual(error);
    });

    it('fetches pages', async () => {
        window.fetch.mockImplementation((url) => {
            switch (url) {
            case 'https://api.github.com/search/issues?per_page=100&q=type%3Apr%20author%3Atest':
                return mockResponse({items: [
                    {
                        repository_url: 'https://api.github.com/repos/user/repo1',
                        author_association: 'CONTRIBUTOR',
                        pull_request: {url: 'https://api.github.com/repos/user/repo1/pulls/1'},
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
                        author_association: 'CONTRIBUTOR',
                        pull_request: {url: 'https://api.github.com/repos/user/repo1/pulls/2'},
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
            case 'https://api.github.com/repos/user/repo1/pulls/2':
                return mockResponse({
                    'merged': false,
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
                merged: 0,
                html_url: 'https://github.com/search?utf8=✓&q=type%3Apr%20author%3Atest%20repo%3ARepo%201',
            },
        ];

        await expect(github.aggregatePullRequests()).resolves.toEqual(result);
    });

    it('filters owned', async () => {
        window.fetch.mockImplementation((url) => {
            switch (url) {
            case 'https://api.github.com/search/issues?per_page=100&q=type%3Apr%20author%3Atest':
                return mockResponse({items: [
                    {
                        repository_url: 'https://api.github.com/repos/user/repo1',
                        author_association: 'CONTRIBUTOR',
                        pull_request: {url: 'https://api.github.com/repos/user/repo1/pulls/1'},
                        state: 'open',
                    },
                    {
                        repository_url: 'https://api.github.com/repos/user/repo2',
                        author_association: 'OWNER',
                        pull_request: {url: 'https://api.github.com/repos/user/repo2/pulls/1'},
                        state: 'open',
                    },
                ]});
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
                closed: 0,
                merged: 0,
                html_url: 'https://github.com/search?utf8=✓&q=type%3Apr%20author%3Atest%20repo%3ARepo%201',
            },
        ];

        await expect(github.aggregatePullRequests()).resolves.toEqual(result);
    });

    it('aggregates', async () => {
        window.fetch.mockImplementation((url) => {
            switch (url) {
            case 'https://api.github.com/search/issues?per_page=100&q=type%3Apr%20author%3Atest':
                return mockResponse({items: [
                    {
                        repository_url: 'https://api.github.com/repos/user/repo1',
                        author_association: 'CONTRIBUTOR',
                        pull_request: {url: 'https://api.github.com/repos/user/repo1/pulls/1'},
                        state: 'open',
                    },
                    {
                        repository_url: 'https://api.github.com/repos/user/repo1',
                        author_association: 'CONTRIBUTOR',
                        pull_request: {url: 'https://api.github.com/repos/user/repo1/pulls/2'},
                        state: 'closed',
                    },
                    {
                        repository_url: 'https://api.github.com/repos/user/repo1',
                        author_association: 'CONTRIBUTOR',
                        pull_request: {url: 'https://api.github.com/repos/user/repo1/pulls/3'},
                        state: 'closed',
                    },
                    {
                        repository_url: 'https://api.github.com/repos/user/repo2',
                        author_association: 'CONTRIBUTOR',
                        pull_request: {url: 'https://api.github.com/repos/user/repo2/pulls/1'},
                        state: 'open',
                    },
                    {
                        repository_url: 'https://api.github.com/repos/user/repo2',
                        author_association: 'CONTRIBUTOR',
                        pull_request: {url: 'https://api.github.com/repos/user/repo2/pulls/2'},
                        state: 'open',
                    },
                    {
                        repository_url: 'https://api.github.com/repos/user/repo3',
                        author_association: 'CONTRIBUTOR',
                        pull_request: {url: 'https://api.github.com/repos/user/repo3/pulls/1'},
                        state: 'closed',
                    },
                    {
                        repository_url: 'https://api.github.com/repos/user/repo3',
                        author_association: 'CONTRIBUTOR',
                        pull_request: {url: 'https://api.github.com/repos/user/repo3/pulls/2'},
                        state: 'closed',
                    },
                ]});
            case 'https://api.github.com/repos/user/repo1/pulls/2':
                return mockResponse({
                    'merged': false,
                });
            case 'https://api.github.com/repos/user/repo1/pulls/3':
                return mockResponse({
                    'merged': false,
                });
            case 'https://api.github.com/repos/user/repo3/pulls/1':
                return mockResponse({
                    'merged': false,
                });
            case 'https://api.github.com/repos/user/repo3/pulls/2':
                return mockResponse({
                    'merged': true,
                });
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
                merged: 0,
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
                merged: 0,
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
                closed: 1,
                merged: 1,
                html_url: 'https://github.com/search?utf8=✓&q=type%3Apr%20author%3Atest%20repo%3ARepo%203',
            },
        ];

        await expect(github.aggregatePullRequests()).resolves.toEqual(result);
    });
});

describe('aggregateIssues', () => {
    it('handles HTTP errors', async () => {
        window.fetch.mockReturnValueOnce({ok: false});

        const error = new Error(
            'Could not fetch https://api.github.com/search/issues?per_page=100&q=type%3Aissue%20author%3Atest'
        );
        await expect(github.aggregateIssues()).rejects.toEqual(error);
    });

    it('requests authorization if 401 Unauthorized', async () => {
        github._authorization = 'token';
        window.fetch.mockReturnValueOnce({status: 401});

        await expect(github.aggregateIssues()).resolves.toEqual(null);
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('access_token');
    });

    it('uses authorization header', async () => {
        github._authorization = 'token';
        window.fetch.mockReturnValueOnce(mockResponse({items: []}));

        await expect(github.aggregateIssues()).resolves.toEqual([]);
    });

    it('handles pagination errors', async () => {
        window.fetch.mockReturnValueOnce(mockResponse({}, {'Link': 'error'}));

        const error = new Error('Pagination error');
        await expect(github.aggregateIssues()).rejects.toEqual(error);
    });

    it('fetches pages', async () => {
        window.fetch.mockImplementation((url) => {
            switch (url) {
            case 'https://api.github.com/search/issues?per_page=100&q=type%3Aissue%20author%3Atest':
                return mockResponse({
                    items: [
                        {
                            repository_url: 'https://api.github.com/repos/user/repo1',
                            author_association: 'CONTRIBUTOR',
                            state: 'open',
                        },
                    ],
                }, {
                    'Link':
                    '<https://api.github.com/search/issues?per_page=100&q=type%3Aissue%20author%3Atest&page=2>;' +
                    ' rel="next", ' +
                    '<https://api.github.com/search/issues?per_page=100&q=type%3Aissue%20author%3Atest&page=2>;' +
                    ' rel="last',
                });
            case 'https://api.github.com/search/issues?per_page=100&q=type%3Aissue%20author%3Atest&page=2':
                return mockResponse({
                    items: [
                        {
                            repository_url: 'https://api.github.com/repos/user/repo1',
                            author_association: 'CONTRIBUTOR',
                            state: 'closed',
                        },
                    ],
                }, {
                    'Link':
                    '<https://api.github.com/search/issues?per_page=100&q=type%3Aissue%20author%3Atest&page=1>;' +
                    ' rel="prev", ' +
                    '<https://api.github.com/search/issues?per_page=100&q=type%3Aissue%20author%3Atest&page=1>;' +
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
                return {ok: false};
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
                html_url: 'https://github.com/search?utf8=✓&q=type%3Aissue%20author%3Atest%20repo%3ARepo%201',
            },
        ];

        await expect(github.aggregateIssues()).resolves.toEqual(result);
    });

    it('filters owned', async () => {
        window.fetch.mockImplementation((url) => {
            switch (url) {
            case 'https://api.github.com/search/issues?per_page=100&q=type%3Aissue%20author%3Atest':
                return mockResponse({
                    items: [
                        {
                            repository_url: 'https://api.github.com/repos/user/repo1',
                            author_association: 'CONTRIBUTOR',
                            state: 'open',
                        },
                        {
                            repository_url: 'https://api.github.com/repos/user/repo2',
                            author_association: 'OWNER',
                            state: 'closed',
                        },
                    ],
                });
            case 'https://api.github.com/repos/user/repo1':
                return mockResponse({
                    html_url: 'https://github.com/user/repo1',
                    full_name: 'Repo 1',
                    stargazers_count: 1,
                    language: 'JavaScript',
                });
            default:
                return {ok: false};
            }
        });

        const result = [{
            repository: {
                html_url: 'https://github.com/user/repo1',
                full_name: 'Repo 1',
                stargazers_count: 1,
                language: 'JavaScript',
            },
            open: 1,
            closed: 0,
            html_url: 'https://github.com/search?utf8=✓&q=type%3Aissue%20author%3Atest%20repo%3ARepo%201',
        }];

        await expect(github.aggregateIssues()).resolves.toEqual(result);
    });

    it('aggregates', async () => {
        window.fetch.mockImplementation((url) => {
            switch (url) {
            case 'https://api.github.com/search/issues?per_page=100&q=type%3Aissue%20author%3Atest':
                return mockResponse({
                    items: [
                        {
                            repository_url: 'https://api.github.com/repos/user/repo1',
                            author_association: 'CONTRIBUTOR',
                            state: 'open',
                        },
                        {
                            repository_url: 'https://api.github.com/repos/user/repo1',
                            author_association: 'CONTRIBUTOR',
                            state: 'closed',
                        },
                        {
                            repository_url: 'https://api.github.com/repos/user/repo2',
                            author_association: 'CONTRIBUTOR',
                            state: 'open',
                        },
                        {
                            repository_url: 'https://api.github.com/repos/user/repo3',
                            author_association: 'CONTRIBUTOR',
                            state: 'closed',
                        },
                        {
                            repository_url: 'https://api.github.com/repos/user/repo3',
                            author_association: 'CONTRIBUTOR',
                            state: 'closed',
                        },
                    ],
                });
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
                return {ok: false};
            }
        });

        const result = [
            {
                repository: {
                    html_url: 'https://github.com/user/repo3',
                    full_name: 'Repo 3',
                    stargazers_count: 2,
                    language: 'Go',
                },
                open: 0,
                closed: 2,
                html_url: 'https://github.com/search?utf8=✓&q=type%3Aissue%20author%3Atest%20repo%3ARepo%203',
            },
            {
                repository: {
                    html_url: 'https://github.com/user/repo1',
                    full_name: 'Repo 1',
                    stargazers_count: 1,
                    language: 'JavaScript',
                },
                open: 1,
                closed: 1,
                html_url: 'https://github.com/search?utf8=✓&q=type%3Aissue%20author%3Atest%20repo%3ARepo%201',
            },
            {
                repository: {
                    html_url: 'https://github.com/user/repo2',
                    full_name: 'Repo 2',
                    stargazers_count: 3,
                    language: 'Python',
                },
                open: 1,
                closed: 0,
                html_url: 'https://github.com/search?utf8=✓&q=type%3Aissue%20author%3Atest%20repo%3ARepo%202',
            },
        ];

        await expect(github.aggregateIssues()).resolves.toEqual(result);
    });
});

describe('authorize', () => {
    it('gets access_token from localStorage', async () => {
        window.localStorage.getItem.mockReturnValueOnce('some_token');

        await github.authorize();

        expect(window.localStorage.getItem).toHaveBeenCalledWith('access_token');
    });

    it('request authorization if access_token is not set', async () => {
        const state = 'ISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISE=';

        await github.authorize();

        expect(paramsGetMock).toHaveBeenCalledWith('code');
        expect(window.localStorage.getItem).toHaveBeenCalledWith('access_token');
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('access_token');
        expect(window.localStorage.setItem).toHaveBeenCalledWith('state', state);
        expect(window.location.replace).toHaveBeenCalledWith(
            'https://github.com/login/oauth/authorize?' +
            'client_id=' + OAUTH_CLIENT_ID + '&' +
            'state=' + encodeURIComponent(state) + '&' +
            'redirect_uri=' + encodeURIComponent(window.location.href)
        );
    });

    it('requires state parameter', async () => {
        paramsGetMock.mockImplementationOnce(() => 'some_code');

        const error = new Error('Missing state');

        await expect(github.authorize()).rejects.toEqual(error);
        expect(window.localStorage.getItem).toHaveBeenCalledWith('access_token');
        expect(paramsGetMock).toHaveBeenCalledWith('state');
    });

    it('checks state parameter', async () => {
        paramsGetMock.mockImplementation(() => 'some_state');
        window.localStorage.getItem.mockImplementation(() => null);

        const error = new Error('Unknown state');

        await expect(github.authorize()).rejects.toEqual(error);
        expect(window.localStorage.getItem).toHaveBeenCalledWith('access_token');
        expect(window.localStorage.getItem).toHaveBeenCalledWith('state');
        expect(paramsGetMock).toHaveBeenCalledWith('state');
    });

    it('saves access_token to localStorage', async () => {
        const state = 'some_state';
        const code = 'some_code';
        const token = 'some_token';

        paramsGetMock
            .mockReturnValueOnce(code)
            .mockReturnValueOnce(state);

        window.localStorage.getItem
            .mockReturnValueOnce(null)
            .mockReturnValueOnce(state);

        window.fetch.mockReturnValueOnce(mockResponse({
            access_token: token,
        }));

        await github.authorize();

        expect(window.localStorage.getItem).toHaveBeenCalledWith('access_token');
        expect(window.localStorage.getItem).toHaveBeenCalledWith('state');
        expect(window.localStorage.setItem).toHaveBeenCalledWith('access_token', token);
        expect(paramsGetMock).toHaveBeenCalledWith('code');
        expect(paramsGetMock).toHaveBeenCalledWith('state');
        expect(paramsDeleteMock).toHaveBeenCalledWith('code');
        expect(paramsDeleteMock).toHaveBeenCalledWith('state');
    });

    it('handles HTTP errors when requesting access_token', async () => {
        const state = 'some_state';
        const code = 'some_code';

        paramsGetMock
            .mockReturnValueOnce(code)
            .mockReturnValueOnce(state);

        window.localStorage.getItem
            .mockReturnValueOnce(null)
            .mockReturnValueOnce(state);

        window.fetch.mockReturnValueOnce({ok: false});

        const error = new Error(`Could not fetch ${OAUTH_GATEWAY_URL}?client_id=${OAUTH_CLIENT_ID}&code=${code}`);
        await expect(github.authorize()).rejects.toEqual(error);

        expect(window.localStorage.getItem).toHaveBeenCalledWith('access_token');
        expect(window.localStorage.getItem).toHaveBeenCalledWith('state');
        expect(paramsGetMock).toHaveBeenCalledWith('code');
        expect(paramsGetMock).toHaveBeenCalledWith('state');
        expect(paramsDeleteMock).toHaveBeenCalledWith('code');
        expect(paramsDeleteMock).toHaveBeenCalledWith('state');
    });

    it('handles response error when requesting access_token', async () => {
        const state = 'some_state';
        const code = 'some_code';

        paramsGetMock
            .mockReturnValueOnce(code)
            .mockReturnValueOnce(state);

        window.localStorage.getItem
            .mockReturnValueOnce(null)
            .mockReturnValueOnce(state);

        window.fetch.mockReturnValueOnce(mockResponse({
            error: 'some_error',
        }));

        const error = new Error('Unable to get access token');
        await expect(github.authorize()).rejects.toEqual(error);

        expect(window.localStorage.getItem).toHaveBeenCalledWith('access_token');
        expect(window.localStorage.getItem).toHaveBeenCalledWith('state');
        expect(paramsGetMock).toHaveBeenCalledWith('code');
        expect(paramsGetMock).toHaveBeenCalledWith('state');
        expect(paramsDeleteMock).toHaveBeenCalledWith('code');
        expect(paramsDeleteMock).toHaveBeenCalledWith('state');
    });

    it('handles empty access_token', async () => {
        const state = 'some_state';
        const code = 'some_code';

        paramsGetMock
            .mockReturnValueOnce(code)
            .mockReturnValueOnce(state);

        window.localStorage.getItem
            .mockReturnValueOnce(null)
            .mockReturnValueOnce(state);

        window.fetch.mockReturnValueOnce(mockResponse({}));

        const error = new Error('Unable to get access token');
        await expect(github.authorize()).rejects.toEqual(error);

        expect(window.localStorage.getItem).toHaveBeenCalledWith('access_token');
        expect(window.localStorage.getItem).toHaveBeenCalledWith('state');
        expect(paramsGetMock).toHaveBeenCalledWith('code');
        expect(paramsGetMock).toHaveBeenCalledWith('state');
        expect(paramsDeleteMock).toHaveBeenCalledWith('code');
        expect(paramsDeleteMock).toHaveBeenCalledWith('state');
    });
});