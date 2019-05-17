import React from 'react';

export default class Tweet extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            error: false,
        };
    }

    componentDidMount() {
        try {
            twttr.widgets.load(); // eslint-disable-line no-undef
        } catch (e) {
            this.setState({error: true});
        }
    }

    render() {
        return !this.state.error && (
            <div>
                <a href="https://twitter.com/share?ref_src=twsrc%5Etfw"
                    className="twitter-share-button"
                    data-text="Check out my contributions to Open Source projects"
                    data-related="e1z4,github"
                    data-show-count="false"
                />
            </div>
        );
    }
}