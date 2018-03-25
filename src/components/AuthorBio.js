import React from 'react';
import PropTypes from 'prop-types';

export default class AuthorBio extends React.PureComponent {
    render() {
        return this.props.text && (
            <div>
                {this.props.text}
            </div>
        );
    }
}

AuthorBio.propTypes = {
    text: PropTypes.string,
};