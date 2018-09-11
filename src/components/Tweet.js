import React from 'react';

export default class Tweet extends React.PureComponent {
    componentDidMount() {
        twttr.widgets.load(); // eslint-disable-line no-undef
    }

    render() {
        return (
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