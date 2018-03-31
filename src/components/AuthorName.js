import React from 'react';
import PropTypes from 'prop-types';

export default class AuthorName extends React.PureComponent {
    render() {
        return (
            <div>
                <a className="text-bold link-gray-dark no-underline" href={this.props.html_url}>{this.props.name}</a>&nbsp;
                <a className="link-gray no-underline" href={this.props.html_url}>{this.props.login}</a>
            </div>
        );
    }
}

AuthorName.propTypes = {
    name: PropTypes.string,
    login: PropTypes.string.isRequired,
    html_url: PropTypes.string.isRequired,
};