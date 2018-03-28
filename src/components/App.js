import ReactDOM from 'react-dom';
import React from 'react';
import PullRequests from './PullRequests';
import GitHub from '../api/GitHub';
import Issues from './Issues';
import Author from './Author';
import AuthorInput from './AuthorInput';
import BlankSlate from './BlankSlate';

class App extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            github: null,
            error: '',
            author: '',
        };
    }

    async componentWillMount() {
        const params = new URL(window.location.href).searchParams;
        const author = params.get('author');

        if (!author) {
            return;
        }

        this.setState({author: author});

        let github;
        try {
            github = new GitHub(author);
            await github.authorize();
        }
        catch (e) {
            this.setState({error: e.toString()});
            return;
        }

        this.setState({github: github});
    }

    render() {
        if (this.state.error) {
            return this.state.error;
        }

        if (!this.state.author) {
            return <BlankSlate/>;
        }

        return this.state.github && (
            <div>
                <AuthorInput value={this.state.author}/>
                <Author github={this.state.github}/>
                <PullRequests github={this.state.github}/>
                <Issues github={this.state.github}/>
            </div>
        );
    }
}

ReactDOM.render(
    <App/>,
    document.getElementById('root')
);