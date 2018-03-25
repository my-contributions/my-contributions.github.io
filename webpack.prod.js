const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'production',
    plugins: [
        new webpack.DefinePlugin({
            OAUTH_GATEWAY_URL: JSON.stringify('https://3fyst874r0.execute-api.eu-central-1.amazonaws.com/prod'),
            OAUTH_CLIENT_ID: JSON.stringify('5d3995b225dc40b5601b'),
        }),
    ],
});