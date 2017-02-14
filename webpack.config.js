const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const chartName = 'BarRankChart';
const chartNameLower = chartName.toLowerCase();

const extractStyles = new ExtractTextPlugin(`${chartNameLower}.css`);

module.exports = {
  devtool: 'source-map',

  entry: {
    [chartNameLower]: `./src/index`
  },

  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
    library: chartName,
    libraryTarget: 'umd',
    umdNamedDefine: true
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          cacheDirectory: true,
          presets: ['es2015']
        }
      },
      {
        test: /\.scss$/,
        include: [
          path.resolve(__dirname, 'src')
        ],
        loader: extractStyles.extract([
          {
            loader: "css-loader",
            options: {
              minimize: true,
              sourceMap: true
            }
          },
          {
            loader: 'sass-loader'
          }
        ])
      },
      {
        test: /\.html$/,
        include: [
          path.resolve(__dirname, 'src')
        ],
        loader: 'html-loader'
      },
    ]
  },

  plugins: [
    new CleanWebpackPlugin(['build']),
    extractStyles,
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compressor: {
        screw_ie8: true,
        warnings: false
      },
      mangle: {
        screw_ie8: true
      },
      output: {
        comments: false,
        screw_ie8: true
      }
    })
  ],

  devServer: {
    host: '0.0.0.0',
    contentBase: [
      path.resolve(__dirname, 'public'),
      path.resolve(__dirname, 'node_modules')
    ]
  }
};