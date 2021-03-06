import React from 'react';
import PropTypes from 'prop-types';
import RepositoryLanguage from './RepositoryLanguage';
import RepositoryStars from './RepositoryStars';
import RepositoryName from './RepositoryName';
import RepositoryCounter from './RepositoryCounter';
import moment from 'moment';

export default class IssuesItem extends React.PureComponent {
    render() {
        return (
            <div className="border-top py-1">
                <div className="d-flex flex-justify-between text-gray">
                    <RepositoryName
                        full_name={this.props.item.repository.full_name}
                        html_url={this.props.item.repository.html_url}
                    />
                    <div className="d-inline-flex flex-justify-end">
                        <RepositoryCounter value={this.props.item.open} html_url={this.props.item.open_html_url} text="open"/>
                        <RepositoryCounter value={this.props.item.closed} html_url={this.props.item.closed_html_url} text="closed"/>
                    </div>
                </div>
                <div className="d-flex flex-justify-between text-gray">
                    <div className="d-inline-flex">
                        <RepositoryLanguage value={this.props.item.repository.language}/>
                        <RepositoryStars value={this.props.item.repository.stargazers_count}/>
                    </div>
                    <div className="f6 mt-1">
                        {moment(this.props.item.updated_at).fromNow()}
                    </div>
                </div>
            </div>
        );
    }
}

IssuesItem.propTypes = {
    item: PropTypes.shape({
        repository: PropTypes.shape({
            full_name: PropTypes.string.isRequired,
            html_url: PropTypes.string.isRequired,
            language: PropTypes.string,
            stargazers_count: PropTypes.number.isRequired,
        }).isRequired,
        open: PropTypes.number.isRequired,
        closed: PropTypes.number.isRequired,
        updated_at: PropTypes.instanceOf(Date).isRequired,
        open_html_url: PropTypes.string.isRequired,
        closed_html_url: PropTypes.string.isRequired,
    }).isRequired,
};