import React from 'react';
import PropTypes from 'prop-types';
import GitHub from '../api/GitHub';
import IssuesItem from './IssuesItem';

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
            items = this.state.items.map((item) =>
                <IssuesItem key={item.repository.html_url} item={item}/>
            );
        }
        else {
            items = 'There are no issues';
        }

        return (
            <div className="flex-row  mt-3">
                {header}
                {items}
            </div>
        );
    }
}

Issues.propTypes = {
    github: PropTypes.instanceOf(GitHub).isRequired,
};