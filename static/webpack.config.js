const webpack = require('webpack');
let ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');


const config = {
    entry:  __dirname + '/js/index.jsx',
    output: {
        path: __dirname + '/dist',
        filename: 'bundle.js',
    },
    resolve: {
        extensions: ['.js', '.jsx', '.css']
    },
    module: {
        rules: [
            {
                test: /\.jsx?/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            },
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: 'css-loader',
                })
            },
            {
                test: /\.(png|svg|jpg|gif|ico)$/,
                use: 'file-loader'
            }
        ]
    },
    plugins: [
        new ExtractTextPlugin('styles.css'),
        new ExtractTextPlugin('all.min.css'),
        new ExtractTextPlugin('bootstrap.min.css'),
        new ExtractTextPlugin('brands.min.css'),
        new ExtractTextPlugin('font-awesome.min.css'),
        new ExtractTextPlugin('regular.min.css'),
        new CopyPlugin([
            { from: __dirname+'/libs', to: __dirname+'/dist' },
        ]),
    ]
};

module.exports = config;
