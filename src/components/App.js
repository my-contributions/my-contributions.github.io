import ReactDOM from 'react-dom';
import React from 'react';
import PullRequests from './PullRequests';
import GitHub from '../api/GitHub';
import Issues from './Issues';


class App extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            github: null,
            error: '',
        };
    }

    async componentWillMount() {
        const params = new URL(window.location.href).searchParams;
        const author = params.get('author');

        if (!author) {
            this.setState({error: 'Missing author'});
            return;
        }

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

        if (this.state.github) {
            return (
                <div>
                    <PullRequests github={this.state.github}/>
                    <Issues github={this.state.github}/>
                </div>
            );
        }

        return null;
    }
}

ReactDOM.render(
    <App/>,
    document.getElementById('root')
);