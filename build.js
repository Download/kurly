var fs = require('fs')
var UglifyJS = require('uglify-js')
var gzipSize = require('gzip-size')
var pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
var log = require('anylogger')(`${pkg.name}:build`)

var error
try {
  var v = pkg.version
  var srcFile = `./${pkg.name}.js`

  var data = fs.readFileSync(srcFile, 'utf8')
  log.info(`Read ${srcFile} (${data.length} bytes)`)

  data = data.replace('module.exports', `this.${pkg.name}`)
  data = data.replace(/process\.env\.DEBUG \|\| process\.env\.LOG/g, `false`)
  data = `(function(){${data}})()`
  log.info(`Bundled ${srcFile} (${data.length} bytes)`)

  data = UglifyJS.minify(data)
  if (data.error) 
    throw new Error(`Error minifying ${srcFile}: ${data.error.message} at line ${data.error.line} column ${data.error.col}`)
  data = data.code
  log.info(`Minified ${srcFile} (${data.length} bytes)`)

  var out = `${pkg.name}.min.js`
  fs.writeFileSync(out, data, 'utf8')
  var gzip = gzipSize.sync(data)
  log.info(`Created ${out} (${data.length} bytes, gzipped ~${gzip} bytes)`)

  var readme = fs.readFileSync('./README.md', 'utf-8')
  readme = readme.replace(/\[\d*\]\(#gzip-size\)/g, '[' + gzip + '](#gzip-size)')
  readme = readme.replace(/\<sub\>\<sup\>\d(\d)?\.\d(\d)?\.\d(\d)?\<\/sup\>\<\/sub\>/g, `<sub><sup>${v}</sup></sub>`)
  readme = readme.replace(/\@\d(\d)?\.\d(\d)?\.\d(\d)?\//g, `@${v}/`)
  fs.writeFileSync('README.md', readme, 'utf8')
  log.info('Updated README')
}
catch(e) {
  error = e
}
finally {
  log.info(error ? `Failed\n${error.message}` : 'Done')
}