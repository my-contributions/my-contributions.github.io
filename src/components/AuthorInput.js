import 'primer-buttons/index.scss';
import 'primer-forms/index.scss';

import React from 'react';
import PropTypes from 'prop-types';
import {authorPattern} from '../api/GitHub';

export default class AuthorInput extends React.PureComponent {
    render() {
        const buttonStyle = {
            display: this.props.value ? 'none' : 'inline',
        };
        const autoFocus = !this.props.value;
        return (
            <form method="get">
                <input className="form-control"
                    defaultValue={this.props.value}
                    type="search"
                    placeholder="GitHub username"
                    name="author"
                    pattern={authorPattern}
                    autoFocus={autoFocus}
                    required
                />
                <button style={buttonStyle} className="btn btn-primary ml-1">Show</button>
            </form>
        );
    }
}

AuthorInput.propTypes = {
    value: PropTypes.string,
};