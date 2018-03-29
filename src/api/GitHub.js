function _AuthorizationError() {
    this.message = 'Authorization error';
    this.name = 'AuthorizationError';
}

export const authorPattern = '^[^ :/]+$';

export default class GitHub {
    constructor(author) {
        if (!new RegExp(authorPattern).test(author)) {
            throw new Error('Invalid author');
        }

        this._author = author;
        this._authorizationHeader = null;
    }

    static _getRandomString() {
        let bytes = new Uint8Array(32);
        crypto.getRandomValues(bytes);

        return btoa(String.fromCharCode(...bytes));
    }

    static _requestAuthorization() {
        localStorage.removeItem('access_token');

        const state = GitHub._getRandomString();
        localStorage.setItem('state', state);

        window.location.replace(
            'https://github.com/login/oauth/authorize?' +
            'client_id=' + OAUTH_CLIENT_ID + '&' +
            'state=' + encodeURIComponent(state) + '&' +
            'redirect_uri=' + encodeURIComponent(window.location.href)
        );
    }

    // Parses the Link header and returns a corresponding object.
    // Please see https://developer.github.com/v3/guides/traversing-with-pagination/.
    static _getPageLinks(headers) {
        const result = {
            next: null,
            last: null,
            first: null,
            prev: null,
        };

        const link = headers.get('Link');
        if (link == null)
            return result;

        const urls = /<([^<>]+)>; rel="(next|last|first|prev)"/.exec(link);
        if (urls == null || urls.length < 3) {
            throw new Error('Pagination error');
        }

        let i = urls.length - 1;
        while (i) {
            result[urls[i]] = urls[i - 1];
            i -= 2;
        }

        return result;
    }

    static _reducePullRequests(items) {
        return items.reduce((result, value) => {
            const url = value.repository_url;
            const repository = result[url] || {
                open: 0,
                merged: 0,
                closed: 0,
            };

            repository[value.state] += 1;
            result[url] = repository;

            return result;
        }, {});
    }

    static _reduceIssues(items) {
        return items.reduce((result, value) => {
            const url = value.repository_url;
            const repository = result[url] || {
                open: 0,
                closed: 0,
            };

            repository[value.state] += 1;
            result[url] = repository;

            return result;
        }, {});
    }

    static _sortPullRequests(items) {
        return items.sort((a, b) => {
            const aCount = a.open + a.closed + a.merged;
            const bCount = b.open + b.closed + b.merged;

            if (aCount == bCount) {
                return a.repository.stargazers_count < b.repository.stargazers_count;
            }
            return aCount < bCount;
        });
    }

    static _sortIssues(items) {
        return items.sort((a, b) => {
            const aCount = a.open + a.closed;
            const bCount = b.open + b.closed;

            if (aCount == bCount) {
                return a.repository.stargazers_count < b.repository.stargazers_count;
            }
            return aCount < bCount;
        });
    }

    _htmlURL(type, repo) {
        const q = encodeURIComponent(`type:${type} author:${this._author} repo:${repo}`);
        return 'https://github.com/search?utf8=✓&q=' + q;
    }

    async _getAccessToken(code) {
        const response = await this._fetchJSON(
            OAUTH_GATEWAY_URL + '?' +
            'client_id=' + OAUTH_CLIENT_ID + '&' +
            'code=' + code,
            {method: 'POST'},
        );
        if (response.error || !response.access_token) {
            throw new Error('Unable to get access token');
        }

        return response.access_token;
    }

    get _authorization() {
        return this._authorizationHeader;
    }

    set _authorization(token) {
        this._authorizationHeader = {Authorization: 'token ' + token};
    }

    get author() {
        return this._author;
    }

    async _fetch(url, init) {
        let response;
        if (this._authorization) {
            const authorizedInit = Object.assign({headers: this._authorizationHeader}, init);
            response = await fetch(url, authorizedInit);
            if (response.status == 401) {
                throw new _AuthorizationError();
            }
        }
        else {
            response = await fetch(url, init);
        }

        if (!response.ok) {
            throw new Error('Could not fetch ' + url);
        }

        return response;
    }

    async _fetchJSON(url, init) {
        const response = await this._fetch(url, init);
        return await response.json();
    }

    async _augmentPullRequests(items) {
        const promises = Object.entries(items).map(async (entry) => {
            const repository = await this._fetchJSON(entry[0]);
            return {
                repository: {
                    html_url: repository.html_url,
                    full_name: repository.full_name,
                    stargazers_count: repository.stargazers_count,
                    language: repository.language,
                },
                open: entry[1].open,
                closed: entry[1].closed,
                merged: entry[1].merged,
                html_url: this._htmlURL('pr', repository.full_name),
            };
        });

        return await Promise.all(promises);
    }

    async _augmentIssues(items) {
        const promises = Object.entries(items).map(async (entry) => {
            const repository = await this._fetchJSON(entry[0]);
            return {
                repository: {
                    html_url: repository.html_url,
                    full_name: repository.full_name,
                    stargazers_count: repository.stargazers_count,
                    language: repository.language,
                },
                open: entry[1].open,
                closed: entry[1].closed,
                html_url: this._htmlURL('issue', repository.full_name),
            };
        });

        return await Promise.all(promises);
    }

    async _fetchPages(url, items) {
        const response = await this._fetch(url);
        const result = await response.json();
        if (items) {
            Array.prototype.push.apply(items, result.items);
        }

        const links = GitHub._getPageLinks(response.headers);
        if (links.next) {
            await this._fetchPages(links.next, result.items);
        }

        return result;
    }

    async _isMerged(url) {
        const pr = await this._fetchJSON(url);
        return pr.merged;
    }

    async _fetchPullRequests() {
        const q = encodeURIComponent('type:pr author:' + this._author);
        const pullRequests = await this._fetchPages('https://api.github.com/search/issues?per_page=100&q=' + q);
        const filtered = pullRequests.items.filter((item) => item.author_association != 'OWNER');

        const promises = filtered.map(async (item) => {
            if (item.state == 'closed' && await this._isMerged(item.pull_request.url)) {
                item.state = 'merged';
            }
            return item;
        });

        return await Promise.all(promises);
    }

    async _fetchIssues() {
        const q = encodeURIComponent('type:issue author:' + this._author);
        const issues = await this._fetchPages('https://api.github.com/search/issues?per_page=100&q=' + q);
        const filtered = issues.items.filter((item) => item.author_association != 'OWNER');

        return filtered;
    }

    async authorize() {
        let accessToken = window.localStorage.getItem('access_token');
        if (accessToken) {
            this._authorization = accessToken;
            return;
        }

        const params = new URL(window.location.href).searchParams;

        const code = params.get('code');
        if (!code) {
            GitHub._requestAuthorization();
            return;
        }

        const state = params.get('state');
        if (!state) {
            throw new Error('Missing state');
        }

        const localState = localStorage.getItem('state');
        if (localState != state) {
            throw new Error('Unknown state');
        }

        params.delete('code');
        params.delete('state');
        window.history.replaceState({}, document.title, '?' + params.toString());

        accessToken = await this._getAccessToken(code);

        this._authorization = accessToken;
        localStorage.setItem('access_token', accessToken);
    }

    async aggregatePullRequests() {
        let results;

        try {
            const pullRequests = await this._fetchPullRequests();
            const reduced = GitHub._reducePullRequests(pullRequests);
            results = await this._augmentPullRequests(reduced);
        }
        catch (e) {
            if (e.name == 'AuthorizationError') {
                GitHub._requestAuthorization();
                return null;
            }
            throw e;
        }

        return GitHub._sortPullRequests(results);
    }

    async aggregateIssues() {
        let results;

        try {
            const issues = await this._fetchIssues();
            const reduced = GitHub._reduceIssues(issues);
            results = await this._augmentIssues(reduced);
        }
        catch (e) {
            if (e.name == 'AuthorizationError') {
                GitHub._requestAuthorization();
                return null;
            }
            throw e;
        }

        return GitHub._sortIssues(results);
    }

    async getUser() {
        let user;

        try {
            user = await this._fetchJSON('https://api.github.com/users/' + this._author);
        }
        catch (e) {
            if (e.name == 'AuthorizationError') {
                GitHub._requestAuthorization();
                return null;
            }
            throw e;
        }

        return {
            login: user.login,
            html_url: user.html_url,
            name: user.name,
            bio: user.bio,
            location: user.location,
        };
    }
}