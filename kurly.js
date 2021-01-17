// kurly - Pluggable templating engine for Node and browsers
// © 2021 by Stijn de Witt
// License: MIT
var kurly = {
  parse: require('./parse'),
  compile: require('./compile'),
}

kurly.default = kurly
module.exports = kurly
