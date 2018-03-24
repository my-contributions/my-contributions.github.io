import React from 'react';
import PropTypes from 'prop-types';
import GitHub from '../api/GitHub';
import Repository from './Repository';
import RepositoryIssues from './RepositoryIssues';

export default class Issues extends React.PureComponent {
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
                items: await this.props.github.aggregateIssues(),
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

        const header = <h3>Issues</h3>;
        let items;

        if (this.state.items == null) {
            items = 'Loading...';
        }
        else if (this.state.items.length) {
            const listItems = this.state.items.map((item) =>
                <li key={item.repository.full_name}>
                    <Repository item={item.repository}/>
                    <RepositoryIssues url={item.html_url} closed={item.closed} open={item.open}/>
                </li>
            );
            items = <ul>{listItems}</ul>;
        }
        else {
            items = 'There are no issues';
        }

        return (
            <div>
                {header}
                {items}
            </div>
        );
    }
}

Issues.propTypes = {
    github: PropTypes.instanceOf(GitHub).isRequired,
};