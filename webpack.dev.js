const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        contentBase: './dist',
    },
    plugins: [
        new webpack.DefinePlugin({
            OAUTH_GATEWAY_URL: JSON.stringify('https://3fyst874r0.execute-api.eu-central-1.amazonaws.com/test'),
            OAUTH_CLIENT_ID: JSON.stringify('6054b751fc70c1590231'),
        }),
    ],
});