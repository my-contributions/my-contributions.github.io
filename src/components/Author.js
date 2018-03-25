import PropTypes from 'prop-types';
import GitHub from '../api/GitHub';
import React from 'react';
import AuthorName from './AuthorName';
import AuthorBio from './AuthorBio';
import AuthorLocation from './AuthorLocation';

export default class Author extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            author: null,
            error: '',
        };
    }

    async componentWillMount() {
        try {
            this.setState({
                author: await this.props.github.getUser(),
            });
        }
        catch(e) {
            this.setState({error: e.toString()});
        }
    }

    render() {
        if (this.state.error) {
            return this.state.error;
        }

        if (!this.state.author) {
            return null;
        }

        return (
            <div>
                <AuthorName name={this.state.author.name} login={this.state.author.login} html_url={this.state.author.html_url}/>
                <AuthorBio text={this.state.author.bio}/>
                <AuthorLocation text={this.state.author.location}/>
            </div>
        );
    }
}

Author.propTypes = {
    github: PropTypes.instanceOf(GitHub).isRequired,
};