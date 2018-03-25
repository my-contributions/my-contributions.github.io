import React from 'react';
import PropTypes from 'prop-types';

export default class Repository extends React.PureComponent {
    render() {
        let details = `${this.props.item.stargazers_count} stars`;
        if (this.props.item.language) {
            details += `, ${this.props.item.language}`;
        }
        return (
            <div>
                <a href={this.props.item.html_url}>{this.props.item.full_name}</a> ({details})
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