import './RepositoryLanguage.scss';

import React from 'react';
import PropTypes from 'prop-types';
import GitHubColors from 'github-colors';

export default class RepositoryLanguage extends React.PureComponent {
    render() {
        if (!this.props.value) {
            return null;
        }

        const style = {
            backgroundColor: GitHubColors.get(this.props.value, true).color,
        };
        return (
            <div className="f5 d-flex flex-items-center mr-3">
                <span className="repository-language" style={style}/>&nbsp;{this.props.value}
            </div>
        );
    }
}

RepositoryLanguage.propTypes = {
    value: PropTypes.string,
};