import React from 'react';
import PropTypes from 'prop-types';
import FlashError from './FlashError';

export default class ErrorBoundary extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            error: null,
        };
    }

    componentDidCatch(error) {
        this.setState({error: error});
    }

    render() {
        // Ignore errors related to Twitter widget.
        if (this.state.error && !this.state.error.toString().includes('twttr')) {
            return <FlashError error={this.state.error}/>;
        }
        return this.props.children;
    }
}

ErrorBoundary.propTypes = {
    children: PropTypes.element.isRequired,
};