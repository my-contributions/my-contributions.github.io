import './Header.scss';

import React from 'react';
import PropTypes from 'prop-types';
import AuthorInput from './AuthorInput';
import MarkGitHub from './MarkGitHub';

const logoClass = 'h4 no-underline text-shadow-light text-gray mr-3';

export default class Header extends React.PureComponent {
    render() {
        if (this.props.showInput) {
            return (
                <div className="header">
                    <div className="header-contents">
                        <div className="d-inline-flex flex-items-center">
                            <a className={logoClass} href="/">My Contributions</a>
                            <AuthorInput/>
                        </div>
                        <MarkGitHub/>
                    </div>
                </div>
            );
        }
        return (
            <div className="header">
                <div className="header-contents">
                    <a className={logoClass} href="/">My Contributions</a>
                    <MarkGitHub/>
                </div>
            </div>
        );
    }
}

Header.propTypes = {
    showInput: PropTypes.bool,
};

Header.defaultProps = {
    showInput: false,
};