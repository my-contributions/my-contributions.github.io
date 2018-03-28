import 'primer-buttons/index.scss';
import 'primer-forms/index.scss';

import React from 'react';
import PropTypes from 'prop-types';
import {authorPattern} from '../api/GitHub';

export default class AuthorInput extends React.PureComponent {
    render() {
        const buttonHidden = Boolean(this.props.value);
        const autoFocus = !buttonHidden;
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
                <button hidden={buttonHidden} className="btn btn-primary ml-1">Show</button>
            </form>
        );
    }
}

AuthorInput.propTypes = {
    value: PropTypes.string,
};