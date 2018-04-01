import React from 'react';
import PropTypes from 'prop-types';
import RepositoryLanguage from './RepositoryLanguage';
import RepositoryStars from './RepositoryStars';
import RepositoryName from './RepositoryName';
import RepositoryCounter from './RepositoryCounter';

export default class PullRequestsItem extends React.PureComponent {
    render() {
        return (
            <div className="border-top py-1">
                <div className="d-flex flex-justify-between text-gray">
                    <RepositoryName
                        full_name={this.props.item.repository.full_name}
                        html_url={this.props.item.repository.html_url}
                    />
                    <div className="d-inline-flex flex-justify-end">
                        <RepositoryCounter value={this.props.item.merged} html_url={this.props.item.html_url} text="merged"/>
                        <RepositoryCounter value={this.props.item.open} html_url={this.props.item.html_url} text="open"/>
                        <RepositoryCounter value={this.props.item.closed} html_url={this.props.item.html_url} text="closed"/>
                    </div>
                </div>
                <div className="d-inline-flex text-gray">
                    <RepositoryLanguage value={this.props.item.repository.language}/>
                    <RepositoryStars value={this.props.item.repository.stargazers_count}/>
                </div>
            </div>
        );
    }
}

PullRequestsItem.propTypes = {
    item: PropTypes.shape({
        repository: PropTypes.shape({
            full_name: PropTypes.string.isRequired,
            html_url: PropTypes.string.isRequired,
            language: PropTypes.string,
            stargazers_count: PropTypes.number.isRequired,
        }).isRequired,
        open: PropTypes.number.isRequired,
        closed: PropTypes.number.isRequired,
        merged: PropTypes.number.isRequired,
        html_url: PropTypes.string.isRequired,
    }).isRequired,
};