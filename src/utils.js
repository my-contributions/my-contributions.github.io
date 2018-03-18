async function fetchJSON(url, init) {
    const jsonInit = Object.assign({headers: {Accept: 'application/json'}}, init);
    const response = await fetch(url, jsonInit);
    if (!response.ok) {
        throw new Error('Could not fetch ' + url);
    }

    return await response.json();
}

/* istanbul ignore next */
function getRandomString() {
    let bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);

    return btoa(String.fromCharCode(...bytes));
}

export {fetchJSON, getRandomString};