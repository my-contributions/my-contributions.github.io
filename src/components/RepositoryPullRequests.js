import React from 'react';
import PropTypes from 'prop-types';

export default class RepositoryPullRequests extends React.PureComponent {
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