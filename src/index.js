import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import aggregatePullRequests from './github';

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
            author: '',
            hasError: false,
            pullRequests: null,
        };
    }

    async componentWillMount() {
        const params = new URL(window.location.href).searchParams;
        const author = params.get('author');

        if (!author) {
            return;
        }

        this.setState({
            author: author,
        });

        try {
            this.setState({
                pullRequests: await aggregatePullRequests(author),
            });
        }
        catch(e) {
            this.setState({
                hasError: true,
            });
        }
    }

    render() {
        if (this.state.hasError) {
            return 'Something went wrong';
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