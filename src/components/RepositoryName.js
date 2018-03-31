import React from 'react';
import PropTypes from 'prop-types';

export default class RepositoryName extends React.PureComponent {
    render() {
        const repository = this.props.full_name.split('/', 2);
        return (
            <div>
                <a className="link-gray no-underline" href={this.props.html_url}>
                    <span>{repository[0]}</span>/<span className="text-bold">{repository[1]}</span>
                </a>
            </div>
        );
    }
}

RepositoryName.propTypes = {
    full_name: PropTypes.string.isRequired,
    html_url: PropTypes.string.isRequired,
};