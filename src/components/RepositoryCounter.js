import './RepositoryCounter.scss';

import React from 'react';
import PropTypes from 'prop-types';

export default class RepositoryCounter extends React.PureComponent {
    render() {
        return Boolean(this.props.value) && (
            <div>
                <a style={{cursor: 'pointer'}} className="link-gray no-underline" href={this.props.html_url}>
                    <span className={`counter ${this.props.text}`}>{this.props.value}</span>
                    &nbsp;{this.props.text}
                </a>
            </div>
        );
    }
}

RepositoryCounter.propTypes = {
    value: PropTypes.number.isRequired,
    text: PropTypes.string.isRequired,
    html_url: PropTypes.string.isRequired,
};