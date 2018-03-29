import 'primer-base/index.scss';
import 'primer-blankslate/index.scss';
import 'primer-utilities/index.scss';
import 'primer-marketing/index.scss';

import React from 'react';
import AuthorInput from './AuthorInput';
import Header from './Header';

export default class BlankSlate extends React.PureComponent {
    render() {
        return (
            <div>
                <Header/>
                <div className="blankslate blankslate-clean-background">
                    <p className="alt-lead mb-3">Show off your open source contributions and check out others</p>
                    <AuthorInput/>
                </div>
            </div>
        );
    }
}