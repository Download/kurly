var fs = require('fs')
var pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
var log = require('ulog')(`${pkg.name}:build`)
var gzipSize = require('gzip-size')

var error
try {
  var v = pkg.version
  var out = `${pkg.name}.min.js`
  var data = fs.readFileSync(out, 'utf8')
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
