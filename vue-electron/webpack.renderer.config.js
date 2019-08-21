process.env.BABEL_ENV = 'renderer';

const path = require('path');

const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const { dependencies } = require('../package.json');

const whiteListedModules = ['vue', 'vuetify'];

const rendererConfig = {
  mode: process.env.NODE_ENV,
  entry: {
    renderer: path.join(__dirname, '../src/renderer/main.js'),
  },
  externals: [
    ...Object.keys(dependencies || {}).filter(d => !whiteListedModules.includes(d)),
  ],
  module: {
    rules: [{
      test: /\.(js|vue)$/,
      enforce: 'pre',
      exclude: /node_modules/,
      use: {
        loader: 'eslint-loader',
        options: {
          formatter: require('eslint-friendly-formatter'),
        },
      },
    },
    {
      test: /\.worker\.js$/,
      use: {
        loader: 'worker-loader',
      },
    },
    {
      test: /\.scss$/,
      use: ['vue-style-loader', 'css-loader',
        'sass-loader',
      ],
    },
    {
      test: /\.css$/,
      use: [MiniCssExtractPlugin.loader, 'css-loader'],
    },
    {
      test: /\.html$/,
      use: 'vue-html-loader',
    },
    {
      test: /\.js$/,
      use: 'babel-loader',
      exclude: /node_modules/,
    },
    {
      test: /\.node$/,
      use: 'node-loader',
    },
    {
      test: /\.vue$/,
      use: {
        loader: 'vue-loader',
        options: {
          extractCSS: process.env.NODE_ENV === 'production',
          loaders: {
            sass: 'vue-style-loader!css-loader!sass-loader?indentedSyntax=1',
            scss: 'vue-style-loader!css-loader!sass-loader',
          },
        },
      },
    },
    {
      test: /\.(png|jpg|gif|svg)(\?.*)?$/,
      use: {
        loader: 'url-loader',
        query: {
          limit: 10000,
          name: 'imgs/[name]--[folder].[ext]',
        },
      },
    },
    {
      test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
      use: {
        loader: 'url-loader',
        query: {
          limit: 10000,
          name: 'fonts/[name]--[folder].[ext]',
        },
      },
    },
    ],
  },
  node: {
    __dirname: process.env.NODE_ENV !== 'production',
    __filename: process.env.NODE_ENV !== 'production',
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css',
    }),
    new webpack.HashedModuleIdsPlugin(),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      chunksSortMode: 'none',
      template: path.resolve(__dirname, '../src/index.ejs'),
      nodeModules: process.env.NODE_ENV !== 'production'
        ? path.resolve(__dirname, '../node_modules')
        : false,
    }),
    new VueLoaderPlugin(),
  ],
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '../dist/electron'),
    globalObject: 'this',
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, '../src/renderer'),
      vue$: 'vue/dist/vue.esm.js',
    },
    extensions: ['.js', '.vue', '.json', '.css', '.node'],
  },
  target: 'electron-renderer',
};

/**
 * Adjust rendererConfig for production settings
 */
if (process.env.NODE_ENV === 'production') {
  rendererConfig.plugins.push(new CopyWebpackPlugin([{
    from: path.join(__dirname, '../static'),
    to: path.join(__dirname, '../dist/electron/static'),
    ignore: ['.*'],
  }]));
} else {
  rendererConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
}

module.exports = rendererConfig;
