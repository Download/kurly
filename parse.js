/**
 * Parses a string with template tags in it into an abstract syntax tree.
 *
 * @param {Object} options An optional options object
 * @param {String} str The string to parse, may be null or undefined
 *
 * @returns An array, possibly empty but never null or undefined.
 */
function parse(str, options) {
  if (process.env.NODE_ENV != 'production') {
    if (str && typeof str != 'string') throw new TypeError('`str` is not a string: ' + typeof str)
    if (options && (typeof options != 'object')) throw new TypeError('`options` is not an object: ' + typeof options)
    if (Array.isArray(options)) throw new TypeError('`options` is not an object: array')
  }

  var openTag = options && options.open || '{'
  var closeTag = options && options.close || '}'
  var opt = options && options.optional
  var regex = new RegExp('(' + openTag + (opt ? '?' : '') + ')([_a-zA-Z][_a-zA-Z0-9]*)([^_a-zA-Z0-9' + closeTag + '].*)?(' + closeTag + (opt ? '?' : '') + ')')
  var tag, result = []

  if (str || (str === '')) {
    while (tag = next(str, regex, openTag, closeTag)) {
      var before = str.substring(0, tag.index)
      if (before) result.push(before)
      tag.ast = !options || tag.open ? parse(tag.text, options) : tag.text ? [ tag.text ] : []
      str = str.substring(tag.end)
      result.push(tag)
    }
    if (str) result.push(str)
  }
  return result
}

/**
 * Finds the next tag in the given `str` and returns a record with the tag
 * name, the index where it starts in the string, the index where it ends
 * and the text contained in the body of the tag.
 *
 * @param {String} str The string to search in
 * @param {Object} options An optional options object
 *
 * @returns {Object} The tag info object, or `undefined` if no tags were found.
 */
function next(str, regex, openTag, closeTag) {
  var match = str.match(regex)
  if (!match) return

  var result = {
    index: match.index,
    open: match[1],
    name: match[2],
    sep: '',
    text: '',
    close: match[4]
  }

  // 'naked' tags, that have no open/close markers, are space terminated
  if (! result.open) {
    result.end = str.indexOf(' ', result.index)
    result.end = result.end === -1 ? str.length : result.end
    result.text = str.substring(match.index + result.name.length, result.end)
    return result
  }

  // tags that have open/close markers are parsed
  var esc = false
  var open = 1
  var start = match.index+result.name.length+result.open.length
  if (start == str.length) return

  for (var i=start; i<str.length; i++) {
    var token = str[i]
    if (esc) {
      token = (token == 'n') ? '\n' :
              (token == 't') ? '\t' :
              (token == openTag) ||
              (token == closeTag) ||
              (token == '\\') ? token :
              '\\' + token // unrecognized escape sequence is ignored
    }
    else {
      if (token === openTag) {
        open++
      }
      if (token === closeTag) {
        open--
        if (!open) {
          result.end = i + 1
          break
        }
      }
      if (token === '\\') {
        esc = true
        continue
      }
      if (!result.text && token.search(/\s/) === 0) {
        result.sep += token
        continue
      }
    }
    result.text += token
    esc = false
  }
  return result
}

parse.default = parse
module.exports = parse
