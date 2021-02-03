var pkg = require('./package.json')
var path = require('path')
var dir = path.resolve(__dirname)
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  node: false,
  context: dir,
  entry: {
    [pkg.name]: pkg.main,
  },
  output: {
    path: dir,
    filename: '[name].min.js',
    environment: {
      // does the environment support arrow functions ('() => { ... }') ?
      arrowFunction: false,
    }
  },
  devtool: false,
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        // extractComments: false,
      }),
    ],
  },
}
