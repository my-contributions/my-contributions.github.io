import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import {aggregatePullRequests, AuthorizationError, getAccessToken} from './github';
import {getRandomString} from './utils';

class RepositoryPullRequests extends React.PureComponent {
    render() {
        const summary = `${this.props.merged} merged, ${this.props.closed} closed, ${this.props.open} open`;
        return (
            <div>
                <a href={this.props.url}>{summary}</a>
            </div>
        );
    }
}

RepositoryPullRequests.propTypes = {
    merged: PropTypes.number.isRequired,
    closed: PropTypes.number.isRequired,
    open: PropTypes.number.isRequired,
    url: PropTypes.string.isRequired,
};

class Repository extends React.PureComponent {
    render() {
        let details = `${this.props.item.stargazers_count} stars`;
        if (this.props.item.language) {
            details += `, ${this.props.item.language}`;
        }
        return (
            <div>
                <a href={this.props.item.html_url}>{this.props.item.full_name}</a>&nbsp;
                ({details})
            </div>
        );
    }
}

Repository.propTypes = {
    item: PropTypes.shape({
        full_name: PropTypes.string.isRequired,
        html_url: PropTypes.string.isRequired,
        language: PropTypes.string,
        stargazers_count: PropTypes.number.isRequired,
    }).isRequired,
};

class PullRequestsList extends React.PureComponent {
    render() {
        const listItems = this.props.items.map((item) =>
            <li key={item.repository.full_name}>
                <Repository item={item.repository}/>
                <RepositoryPullRequests url={item.html_url} merged={item.merged} closed={item.closed} open={item.open}/>
            </li>
        );
        return <ul>{listItems}</ul>;
    }
}

PullRequestsList.propTypes = {
    items: PropTypes.arrayOf(PropTypes.object).isRequired,
};

class PullRequests extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            error: null,
            pullRequests: null,
        };
    }

    static authorize(redirectUri) {
        const state = getRandomString();
        localStorage.setItem('state', state);

        window.location.replace(
            'https://github.com/login/oauth/authorize?' +
            'client_id=' + OAUTH_CLIENT_ID + '&' +
            'state=' + encodeURIComponent(state) + '&' +
            'redirect_uri=' + encodeURIComponent(redirectUri)
        );
    }

    async componentWillMount() {
        const params = new URL(window.location.href).searchParams;
        const author = params.get('author');

        if (!author) {
            return;
        }

        let accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
            const code = params.get('code');
            if (!code) {
                return PullRequests.authorize(window.location.href);
            }

            const state = params.get('state');
            if (!state) {
                this.setState({
                    error: 'Missing state',
                });
                return;
            }

            const localState = localStorage.getItem('state');
            if (localState != state) {
                this.setState({
                    error: 'Unknown state',
                });
                return;
            }

            try {
                accessToken = await getAccessToken(code);
            }
            catch (e) {
                this.setState({
                    error: e.toString(),
                });
                return;
            }

            params.delete('code');
            params.delete('state');
            window.history.replaceState({}, document.title, '?' + params.toString());

            localStorage.setItem('access_token', accessToken);
        }

        try {
            this.setState({
                pullRequests: await aggregatePullRequests(author, accessToken),
            });
        }
        catch(e) {
            if (e instanceof AuthorizationError) {
                localStorage.removeItem('access_token');
                return PullRequests.authorize(window.location.href);
            }
            this.setState({
                error: e.toString(),
            });
        }
    }

    render() {
        if (this.state.error) {
            return this.state.error;
        }

        if (this.state.pullRequests) {
            let pullRequests = 'There are no pull requests';
            if (this.state.pullRequests.length) {
                pullRequests = <PullRequestsList items={this.state.pullRequests}/>;
            }
            return (
                <div>
                    <h3>Pull Requests</h3>
                    {pullRequests}
                </div>
            );
        }

        return null;
    }
}

ReactDOM.render(
    <PullRequests/>,
    document.getElementById('root')
);