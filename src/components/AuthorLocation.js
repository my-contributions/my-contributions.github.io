import './AuthorLocation.scss';

import React from 'react';
import PropTypes from 'prop-types';

import LocationIcon from 'octicons/build/svg/location.svg';

export default class AuthorLocation extends React.PureComponent {
    render() {
        return this.props.text && (
            <div className="author-location">
                <LocationIcon width={12} height={16}/>&nbsp;{this.props.text}
            </div>
        );
    }
}

AuthorLocation.propTypes = {
    text: PropTypes.string,
};