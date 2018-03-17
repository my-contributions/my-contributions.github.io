import {fetchJSON} from './utils';

async function getAccessToken(code) {
    const response = await fetchJSON(
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

class AuthorizationError extends Error {}

class GitHub {
    constructor(accessToken) {
        this._authorization = {Authorization: 'token ' + accessToken};
    }

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

    static _htmlURL(type, author, repo) {
        const q = encodeURIComponent(`type:${type} author:${author} repo:${repo}`);
        return 'https://github.com/search?utf8=✓&q=' + q;
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

    async _fetch(url) {
        const response = await fetch(url, {headers: this._authorization});
        if (response.status == 401) {
            throw new AuthorizationError();
        }
        if (!response.ok) {
            throw new Error('Could not fetch ' + url);
        }

        return response;
    }

    async _fetchJSON(url) {
        const response = await this._fetch(url);
        return await response.json();
    }

    async _fetchRepositoryData(items, author) {
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
                html_url: GitHub._htmlURL('pr', author, repository.full_name),
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

    async _fetchPullRequests(author) {
        const q = encodeURIComponent('type:pr author:' + author);
        const pullRequests = await this._fetchPages('https://api.github.com/search/issues?per_page=100&q=' + q);

        const promises = pullRequests.items.map(async (item) => {
            if (item.state == 'closed' && await this._isMerged(item.pull_request.url)) {
                item.state = 'merged';
            }
            return item;
        });

        return await Promise.all(promises);
    }

    async aggregatePullRequests(author) {
        if (/[ :]/.test(author)) {
            throw new Error('Invalid author');
        }

        const pullRequests = await this._fetchPullRequests(author);
        const reduced = GitHub._reducePullRequests(pullRequests);
        const augmented = await this._fetchRepositoryData(reduced, author);

        return GitHub._sortPullRequests(augmented);
    }
}

const aggregatePullRequests = (author, accessToken) =>
    new GitHub(accessToken).aggregatePullRequests(author);

export {aggregatePullRequests, getAccessToken, AuthorizationError};