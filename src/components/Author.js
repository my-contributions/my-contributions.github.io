import './Author.scss';
import 'primer-avatars/index.scss';

import PropTypes from 'prop-types';
import GitHub from '../api/GitHub';
import React from 'react';
import AuthorName from './AuthorName';
import Tweet from './Tweet';

export default class Author extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            author: null,
            error: null,
        };
    }

    componentDidMount() {
        this.props.github.getUser()
            .then((result) => this.setState({author: result}))
            .catch((error) => this.setState({error: error}));
    }

    render() {
        if (this.state.error) {
            throw this.state.error;
        }

        return this.state.author && (
            <div className="author">
                <img className="avatar mb-2"
                    alt={this.state.author.name}
                    src={this.state.author.avatar_url}
                    height="190"
                    width="190"
                />
                <AuthorName name={this.state.author.name} login={this.state.author.login} html_url={this.state.author.html_url}/>
                <Tweet/>
            </div>
        );
    }
}

Author.propTypes = {
    github: PropTypes.instanceOf(GitHub).isRequired,
};