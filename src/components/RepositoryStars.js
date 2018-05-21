import './RepositoryStars.scss';

import React from 'react';
import PropTypes from 'prop-types';

import StarIcon from 'octicons/build/svg/star.svg';

export default class RepositoryStars extends React.PureComponent {
    render() {
        return Boolean(this.props.value) && (
            <div className="repository-stars">
                <StarIcon width={14} height={16}/>&nbsp;{this.props.value}
            </div>
        );
    }
}

RepositoryStars.propTypes = {
    value: PropTypes.number.isRequired,
};