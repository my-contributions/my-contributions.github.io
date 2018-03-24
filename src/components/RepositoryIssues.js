import React from 'react';
import PropTypes from 'prop-types';

export default class RepositoryIssues extends React.PureComponent {
    render() {
        const summary = `${this.props.closed} closed, ${this.props.open} open`;
        return (
            <div>
                <a href={this.props.url}>{summary}</a>
            </div>
        );
    }
}

RepositoryIssues.propTypes = {
    closed: PropTypes.number.isRequired,
    open: PropTypes.number.isRequired,
    url: PropTypes.string.isRequired,
};