import ReactDOM from 'react-dom';
import React from 'react';
import PullRequests from './PullRequests';
import GitHub from '../api/GitHub';
import Issues from './Issues';
import Author from './Author';
import AuthorInput from './AuthorInput';


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

        const results = this.state.github && (
            <div>
                <Author github={this.state.github}/>
                <PullRequests github={this.state.github}/>
                <Issues github={this.state.github}/>
            </div>
        );

        const header = !this.state.author && 'Show off your open source contributions and check out others';

        return (
            <div>
                {header}
                <AuthorInput value={this.state.author}/>
                {results}
            </div>
        );
    }
}

ReactDOM.render(
    <App/>,
    document.getElementById('root')
);