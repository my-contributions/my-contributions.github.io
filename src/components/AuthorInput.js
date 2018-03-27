import React from 'react';
import PropTypes from 'prop-types';
import {authorPattern} from '../api/GitHub';

export default class AuthorInput extends React.PureComponent {
    render() {
        const buttonHidden = Boolean(this.props.value);
        const autoFocus = !buttonHidden;
        return (
            <form method="get">
                <input
                    defaultValue={this.props.value}
                    type="search"
                    placeholder="GitHub username"
                    name="author"
                    pattern={authorPattern}
                    autoFocus={autoFocus}
                    required
                />
                <button hidden={buttonHidden}>Search</button>
            </form>
        );
    }
}

AuthorInput.propTypes = {
    value: PropTypes.string,
};