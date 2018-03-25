import React from 'react';
import PropTypes from 'prop-types';

export default class AuthorLocation extends React.PureComponent {
    render() {
        return this.props.text && (
            <div>
                {this.props.text}
            </div>
        );
    }
}

AuthorLocation.propTypes = {
    text: PropTypes.string,
};