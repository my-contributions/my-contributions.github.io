import './Results.scss';

import React from 'react';
import PropTypes from 'prop-types';
import GitHub from '../api/GitHub';
import Author from './Author';
import PullRequests from './PullRequests';
import Issues from './Issues';

export default class Results extends React.PureComponent {
    render() {
        return (
            <div className="results">
                <Author github={this.props.github}/>
                <div className="contributions">
                    <PullRequests github={this.props.github}/>
                    <Issues github={this.props.github}/>
                </div>
            </div>
        );
    }
}

Results.propTypes = {
    github: PropTypes.instanceOf(GitHub).isRequired,
};