import React from 'react';
import PropTypes from 'prop-types';
import RepositoryLanguage from './RepositoryLanguage';
import RepositoryStars from './RepositoryStars';
import RepositoryName from './RepositoryName';

export default class Repository extends React.PureComponent {
    render() {
        return (
            <div>
                <RepositoryName full_name={this.props.item.full_name} html_url={this.props.item.html_url}/>
                <div className="d-inline-flex flex-items-end text-gray">
                    <RepositoryLanguage value={this.props.item.language}/>
                    <RepositoryStars value={this.props.item.stargazers_count}/>
                </div>
            </div>
        );
    }
}

Repository.propTypes = {
    item: PropTypes.shape({
        full_name: PropTypes.string.isRequired,
        html_url: PropTypes.string.isRequired,
        language: PropTypes.string,
        stargazers_count: PropTypes.number.isRequired,
    }).isRequired,
};