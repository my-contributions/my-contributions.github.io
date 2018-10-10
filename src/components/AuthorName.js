import React from 'react';
import PropTypes from 'prop-types';

export default class AuthorName extends React.PureComponent {
    render() {
        return (
            <div>
                <a className="h3 link-gray-dark no-underline" href={this.props.html_url}>{this.props.name || this.props.login}</a>
            </div>
        );
    }
}

AuthorName.propTypes = {
    name: PropTypes.string,
    login: PropTypes.string.isRequired,
    html_url: PropTypes.string.isRequired,
};