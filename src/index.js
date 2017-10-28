import React from 'react';
import ReactDOM from 'react-dom';
import {fetchPullRequests} from './github';

class PullRequests extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            author: '',
            hasError: false,
            pullRequests: null,
        };
    }

    async componentWillMount() {
        const params = new URL(window.location.href).searchParams;
        const author = params.get('author');

        if (!author) {
            return;
        }

        this.setState({
            author: author,
        });

        try {
            this.setState({
                pullRequests: await fetchPullRequests(author),
            });
        }
        catch(e) {
            this.setState({
                hasError: true,
            });
        }
    }

    render() {
        if (this.state.pullRequests) {
            return `${this.state.author} has ${this.state.pullRequests.total_count} pull requests`;
        }
        if (this.state.hasError) {
            return 'Something went wrong';
        }
        return 'Nothing to show';
    }
}

ReactDOM.render(
    <PullRequests/>,
    document.getElementById('root')
);