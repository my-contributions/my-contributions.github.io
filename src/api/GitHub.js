function _AuthorizationError() {
    this.message = 'Authorization error';
    this.name = 'AuthorizationError';
}

async function _fetchJSON(url, init) {
    const fetchError = new Error('Could not fetch ' + url);
    let response;

    try {
        response = await fetch(url, init);
    }
    catch (e) {
        throw fetchError;
    }

    if (!response.ok) {
        throw fetchError;
    }

    return await response.json();
}

export const authorPattern = '^[^ :/]+$';

export default class GitHub {
    constructor(author) {
        if (!new RegExp(authorPattern).test(author)) {
            throw new Error('Invalid username');
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
            throw new Error('GitHub API pagination error');
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
                updated_at: new Date(0),
            };

            repository[value.state] += 1;

            const updatedAt = new Date(value.updated_at);
            if (repository.updated_at < updatedAt) {
                repository.updated_at = updatedAt;
            }

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
                updated_at: new Date(0),
            };

            repository[value.state] += 1;
            result[url] = repository;

            const updatedAt = new Date(value.updated_at);
            if (repository.updated_at < updatedAt) {
                repository.updated_at = updatedAt;
            }

            return result;
        }, {});
    }

    static _isNotOwned(item) {
        return (
            item.author_association != 'OWNER' &&
            item.author_association != 'MEMBER'
        );
    }

    _htmlURL(args) {
        let query = `author:${this._author}`;
        for (const i in  args) {
            query += ` ${i}:${args[i]}`;
        }
        return 'https://github.com/search?utf8=✓&q=' + encodeURIComponent(query);
    }

    async _getAccessToken(code) {
        const response = await _fetchJSON(
            OAUTH_GATEWAY_URL + '?' +
            'client_id=' + OAUTH_CLIENT_ID + '&' +
            'code=' + code,
            {method: 'POST'},
        );
        if (response.error || !response.access_token) {
            throw new Error('Authorization error: unable to get access token');
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
        if (this._authorization) {
            init = Object.assign({headers: this._authorizationHeader}, init);
        }

        const fetchError = new Error('Could not fetch ' + url);
        let response;

        try {
            response = await fetch(url, init);
        }
        catch (e) {
            throw fetchError;
        }

        if (response.status == 401) {
            throw new _AuthorizationError();
        }
        if (!response.ok) {
            throw fetchError;
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
                updated_at: entry[1].updated_at,
                open_html_url: this._htmlURL({
                    type: 'pr',
                    repo: repository.full_name,
                    is: 'open',
                }),
                closed_html_url: this._htmlURL({
                    type: 'pr',
                    repo: repository.full_name,
                    is: 'closed',
                }),
                merged_html_url: this._htmlURL({
                    type: 'pr',
                    repo: repository.full_name,
                    is: 'merged',
                }),
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
                updated_at: entry[1].updated_at,
                open_html_url: this._htmlURL({
                    type: 'issue',
                    repo: repository.full_name,
                    is: 'open',
                }),
                closed_html_url: this._htmlURL({
                    type: 'issue',
                    repo:repository.full_name,
                    is: 'closed',
                }),
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
        const filtered = pullRequests.items.filter(GitHub._isNotOwned);

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
        const filtered = issues.items.filter(GitHub._isNotOwned);

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
            throw new Error('Authorization error: missing state');
        }

        const localState = localStorage.getItem('state');
        if (localState != state) {
            throw new Error('Authorization error: unknown state');
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

        return results.sort((a, b) => a.updated_at < b.updated_at);
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

        return results.sort((a, b) => a.updated_at < b.updated_at);
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
            avatar_url: user.avatar_url,
            login: user.login,
            html_url: user.html_url,
            name: user.name,
            bio: user.bio,
            location: user.location,
        };
    }
}