import React from 'react';
import PropTypes from 'prop-types';
import Repository from './Repository';
import RepositoryPullRequests from './RepositoryPullRequests';
import GitHub from '../api/GitHub';

export default class PullRequests extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            items: null,
            error: '',
        };
    }

    async componentWillMount() {
        try {
            this.setState({
                items: await this.props.github.aggregatePullRequests(),
            });
        }
        catch(e) {
            this.setState({error: e.toString()});
        }
    }

    render() {
        if (this.state.error) {
            return this.state.error;
        }

        const header = <h3>Pull Requests</h3>;
        let items;

        if (this.state.items == null) {
            items = 'Loading...';
        }
        else if (this.state.items.length) {
            const listItems = this.state.items.map((item) =>
                <li key={item.repository.full_name}>
                    <Repository item={item.repository}/>
                    <RepositoryPullRequests url={item.html_url} merged={item.merged} closed={item.closed} open={item.open}/>
                </li>
            );
            items = <ul>{listItems}</ul>;
        }
        else {
            items = 'There are no pull requests';
        }

        return (
            <div>
                {header}
                {items}
            </div>
        );
    }
}

PullRequests.propTypes = {
    github: PropTypes.instanceOf(GitHub).isRequired,
};