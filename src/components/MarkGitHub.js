import React from 'react';

import MarkIcon from 'octicons/build/svg/mark-github.svg';

export default class MarkGitHub extends React.PureComponent {
    render() {
        return (
            <div>
                <a href={'https://github.com/my-contributions'}>
                    <MarkIcon width={22} height={22}/>
                </a>
            </div>
        );
    }
}