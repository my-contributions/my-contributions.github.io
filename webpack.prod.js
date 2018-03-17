const webpack = require('webpack');
const merge = require('webpack-merge');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    plugins: [
        new UglifyJSPlugin({
            sourceMap: true,
        }),
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production'),
            },
            OAUTH_GATEWAY_URL: JSON.stringify('https://3fyst874r0.execute-api.eu-central-1.amazonaws.com/prod'),
            OAUTH_CLIENT_ID: JSON.stringify('5d3995b225dc40b5601b'),
        }),
    ],
});