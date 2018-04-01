import './FlashError.scss';

import React from 'react';
import PropTypes from 'prop-types';

export default class FlashError extends React.PureComponent {
    render() {
        return (
            <div className="error">
                {this.props.error.message}
            </div>
        );
    }
}

FlashError.propTypes = {
    error: PropTypes.instanceOf(Error).isRequired,
};