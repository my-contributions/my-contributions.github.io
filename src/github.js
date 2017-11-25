async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Error fetching ' + url);
    }
    return await response.json();
}

async function fetchPullRequests(author) {
    const q = encodeURIComponent('type:pr author:' + author);
    return await fetchJSON('https://api.github.com/search/issues?q=' + q);
}

function htmlURL(type, author, repo) {
    const q = encodeURIComponent(`type:${type} author:${author} repo:${repo}`);
    return 'https://github.com/search?utf8=✓&q=' + q;
}

async function aggregatePullRequests(author) {
    if (/[ :]/.test(author)) {
        throw new Error('Invalid author');
    }

    const pullRequests = await fetchPullRequests(author);

    const reduced = pullRequests.items.reduce((result, value) => {
        const repository_url = value.repository_url;
        let repository = result[repository_url] || {
            open: 0,
            closed: 0,
        };

        if (value.state == 'open') {
            repository.open += 1;
        } else {
            repository.closed += 1;
        }

        result[repository_url] = repository;
        return result;
    }, {});

    const promises = Object.entries(reduced).map(async (entry) => {
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
            html_url: htmlURL('pr', author, repository.full_name),
        };
    });

    const mapped = await Promise.all(promises);
    const sorted = mapped.sort((a, b) => {
        const a_count = a.open + a.closed;
        const b_count = b.open + b.closed;

        if (a_count == b_count) {
            return a.repository.stargazers_count < b.repository.stargazers_count;
        }
        return a_count < b_count;
    });

    return sorted;
}

export default aggregatePullRequests;