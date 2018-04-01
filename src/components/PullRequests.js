import React from 'react';
import PropTypes from 'prop-types';
import GitHub from '../api/GitHub';
import PullRequestsItem from './PullRequestsItem';

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
            items = this.state.items.map((item) =>
                <PullRequestsItem key={item.repository.html_url} item={item}/>
            );
        }
        else {
            items = 'There are no pull requests';
        }

        return (
            <div className="flex-row mt-3">
                {header}
                {items}
            </div>
        );
    }
}

PullRequests.propTypes = {
    github: PropTypes.instanceOf(GitHub).isRequired,
};