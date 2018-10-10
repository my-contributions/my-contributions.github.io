import React from 'react';
import PropTypes from 'prop-types';
import GitHub from '../api/GitHub';
import IssuesItem from './IssuesItem';

export default class Issues extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            items: null,
            error: null,
        };
    }

    componentDidMount() {
        this.props.github.aggregateIssues()
            .then((result) => this.setState({items: result}))
            .catch((error) => this.setState({error: error}));
    }

    render() {
        if (this.state.error) {
            throw this.state.error;
        }

        const header = <h3>Issues</h3>;
        let items;

        if (this.state.items == null) {
            items = (
                <div className="blankslate">
                    Loading...
                </div>
            );
        }
        else if (this.state.items.length) {
            items = this.state.items.map((item) =>
                <IssuesItem key={item.repository.html_url} item={item}/>
            );
        }
        else {
            items = (
                <div className="blankslate">
                    There are no issues
                </div>
            );
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