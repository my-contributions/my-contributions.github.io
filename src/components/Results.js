import './Results.scss';

import React from 'react';
import PropTypes from 'prop-types';
import GitHub from '../api/GitHub';
import Header from './Header';
import Author from './Author';
import PullRequests from './PullRequests';
import Issues from './Issues';

export default class Results extends React.PureComponent {
    render() {
        return (
            <div>
                <Header author={this.props.github.author}/>
                <Author github={this.props.github}/>
                <div className="results">
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