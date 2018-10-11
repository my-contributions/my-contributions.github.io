import 'primer-base/index.scss';
import 'primer-blankslate/index.scss';
import 'primer-utilities/index.scss';
import 'primer-marketing/index.scss';

import React from 'react';
import AuthorInput from './AuthorInput';

import MergeIcon from 'octicons/build/svg/git-merge.svg';
import PullRequestIcon from 'octicons/build/svg/git-pull-request.svg';
import IssueClosedIcon from 'octicons/build/svg/issue-closed.svg';
import IssueOpenedIcon from 'octicons/build/svg/issue-opened.svg';

export default class BlankSlate extends React.PureComponent {
    render() {
        return (
            <div className="blankslate blankslate-clean-background pt-8">
                <MergeIcon width={48} height={48} fill="#959da5"/>
                <IssueOpenedIcon width={48} height={48} fill="#959da5"/><br/>
                <IssueClosedIcon width={48} height={48} fill="#959da5"/>
                <PullRequestIcon width={48} height={48} fill="#959da5"/>
                <p className="alt-lead my-3">Show off your open source contributions and check out others</p>
                <AuthorInput showButton/>
                <p className="alt-h6 mt-2 text-gray">For example <a className="no-underline" href="?author=31z4">31z4</a> or <a className="no-underline" href="?author=summerisgone">summerisgone</a></p>
            </div>
        );
    }
}