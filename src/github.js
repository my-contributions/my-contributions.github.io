function getLink(headers) {
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

async function fetchURL(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Error fetching ' + url);
    }
    return response;
}

async function fetchJSON(url) {
    const response = await fetchURL(url);
    return await response.json();
}

async function fetchPages(url, items) {
    const response = await fetchURL(url);
    const result = await response.json();
    if (items) {
        Array.prototype.push.apply(items, result.items);
    }

    const link = getLink(response.headers);
    if (link.next) {
        await fetchPages(link.next, result.items);
    }

    return result;
}

async function isMerged(url) {
    const pr = await fetchJSON(url);
    return pr.merged;
}

async function fetchPullRequests(author) {
    const q = encodeURIComponent('type:pr author:' + author);
    const pullRequests = await fetchPages('https://api.github.com/search/issues?per_page=100&q=' + q);

    const promises = pullRequests.items.map(async (item) => {
        if (item.state == 'closed' && await isMerged(item.pull_request.url)) {
            item.state = 'merged';
        }
        return item;
    });

    return await Promise.all(promises);
}

function htmlURL(type, author, repo) {
    const q = encodeURIComponent(`type:${type} author:${author} repo:${repo}`);
    return 'https://github.com/search?utf8=✓&q=' + q;
}

function reducePullRequests(items) {
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

async function fetchRepositoryData(items, author) {
    const promises = Object.entries(items).map(async (entry) => {
        const repository = await fetchJSON(entry[0]);
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
            html_url: htmlURL('pr', author, repository.full_name),
        };
    });

    return await Promise.all(promises);
}

function sort(items) {
    return items.sort((a, b) => {
        const aCount = a.open + a.closed + a.merged;
        const bCount = b.open + b.closed + b.merged;

        if (aCount == bCount) {
            return a.repository.stargazers_count < b.repository.stargazers_count;
        }
        return aCount < bCount;
    });
}

async function aggregatePullRequests(author) {
    if (/[ :]/.test(author)) {
        throw new Error('Invalid author');
    }

    const pullRequests = await fetchPullRequests(author);
    const reduced = reducePullRequests(pullRequests);
    const augmented = await fetchRepositoryData(reduced, author);

    return sort(augmented);
}

export default aggregatePullRequests;