import ReactDOM from 'react-dom';
import React from 'react';
import GitHub from '../api/GitHub';
import BlankSlate from './BlankSlate';
import Results from './Results';
import Header from './Header';
import ErrorBoundary from './ErrorBoundary';
import FlashError from './FlashError';

class App extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            github: null,
            error: null,
            author: '',
        };
    }

    componentDidMount() {
        const params = new URL(window.location.href).searchParams;
        const author = params.get('author');

        if (!author) {
            return;
        }

        this.setState({author: author});

        let github;
        try {
            github = new GitHub(author);
        }
        catch (error) {
            this.setState({error: error});
            return;
        }

        github.authorize()
            .then(() => {
                this.setState({github: github});
            })
            .catch((error) => {
                this.setState({error: error});
            });
    }

    render() {
        if (this.state.error) {
            return (
                <React.StrictMode>
                    <Header showInput/>
                    <FlashError error={this.state.error}/>
                </React.StrictMode>
            );
        }

        if (!this.state.author) {
            return (
                <React.StrictMode>
                    <Header/>
                    <BlankSlate/>
                </React.StrictMode>
            );
        }

        return this.state.github && (
            <React.StrictMode>
                <Header showInput/>
                <ErrorBoundary>
                    <Results github={this.state.github}/>
                </ErrorBoundary>
            </React.StrictMode>
        );
    }
}

ReactDOM.render(
    <App/>,
    document.getElementById('root')
);