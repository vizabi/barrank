const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const CleanWebpackPlugin = require('clean-webpack-plugin');
const archiver = require('archiver');

const timestamp = new Date();
const __PROD__ = process.env.NODE_ENV === 'production';

class AfterBuildPlugin {
  constructor(callback) {
    this.callback = callback;
  }

  apply(compiler) {
    compiler.hooks.done.tap('AfterBuildPlugin', this.callback);
  }
}

class NoEmitPlugin {
  constructor(options) {
    this.options = typeof options === "string" ? [ options ] : options;
  }

  apply(compiler) {
    compiler.hooks.emit.tap('NoEmitPlugin', compilation => {
      this.options.forEach(asset => {
        delete compilation.assets[asset];
      });
    });
  }
}

module.exports = (chartName, chartNameLower, dir, output) => {
  const pkg = require(path.resolve(dir, 'package.json'));
  const extractStyles = new MiniCssExtractPlugin({
    filename: "[name].css"
  });
  
  const optimization = {};

  if (__PROD__) {
    optimization.minimizer = [
      new UglifyJsPlugin({
        include: /\.min\.js$/,
        parallel: true,
        sourceMap: true,
        uglifyOptions: {
          compress: {
            warnings: false
          },
          mangle: {
          },
          output: {
            comments: false,
          }
        }
      })
    ]
  }

  return {
    mode: __PROD__ ? 'production': 'development',

    performance: {
      hints: false
    },

    devtool: 'source-map',

    entry: {
      [chartNameLower]: [
        path.resolve(dir, 'src', 'index')
      ],

      [`${chartNameLower}.min`]: [
        path.resolve(dir, 'src', 'index')
      ],
    },

    output: {
      path: output || path.resolve(dir, 'build'),
      filename: '[name].js'
    },

    resolveLoader: {
      modules: [
        'web_loaders',
        'web_modules',
        'node_loaders',
        'node_modules',
        path.resolve(dir, 'node_modules'),
        path.resolve(__dirname, '..'),
        path.resolve(__dirname, 'node_modules'),
      ],
    },
    resolve: {
      modules: [
        path.resolve(dir, 'src'),
        'node_modules',
        path.resolve(__dirname, '..'),
        path.resolve(__dirname, 'node_modules'),
      ]
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            presets: [require.resolve('babel-preset-env')]
          }
        },
        {
          test: /\.scss$/,
          include: [
            path.resolve(dir, 'src')
          ],
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: "css-loader",
              options: {
                minimize: true,
                sourceMap: true
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                config: {
                  path: __dirname
                }
              }
            },
            {
              loader: 'sass-loader',
              options: {
                implementation: require("sass")
              }
            }
          ]
        },
        {
          test: /\.html$/,
          include: [
            path.resolve(dir, 'src')
          ],
          loader: 'html-loader'
        },
        {
          test: /\.cur$/,
          include: [
            path.resolve(dir, 'src', 'assets', 'cursors')
          ],
          loader: 'file-loader',
          options: {
            publicPath: path => path.split('/').slice(1).join('/'),
            name: 'assets/cursors/[name].[ext]',
          }
        },
      ]
    },

    optimization,

    plugins: [
      new CleanWebpackPlugin([path.resolve(dir, 'build')], { root: dir }),
      new webpack.DefinePlugin({
        __VERSION: JSON.stringify(pkg.version),
        __BUILD: +timestamp
      }),
      extractStyles,
      ...(__PROD__ ? [
        new NoEmitPlugin([`${chartNameLower}.min.css`, `${chartNameLower}.min.css.map`]),
        new AfterBuildPlugin(() => {
          const archive = archiver('zip');

          archive.glob('**', { ignore: ['*.zip'], cwd: path.resolve(dir, 'build') });
          archive.pipe(fs.createWriteStream(path.resolve(dir, 'build', `${chartNameLower}.zip`)));

          archive.finalize();
        })
      ] : [])
    ],

  };

};
