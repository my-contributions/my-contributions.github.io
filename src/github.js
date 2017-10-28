export const fetchPullRequests = async (author) => {
    if (/[ :]/.test(author)) {
        throw new Error('Invalid author');
    }

    const q = encodeURIComponent(`type:pr author:${author}`);
    const response = await fetch('https://api.github.com/search/issues?q=' + q);

    if (!response.ok) {
        throw new Error('Error fetching pull requests');
    }

    return await response.json();
};