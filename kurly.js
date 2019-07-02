/**
 * kurly - Pluggable templating engine for Node and browsers
 * =========================================================
 * 
 * `kurly` is a small, yet powerful templating engine for node and browsers.
 * It's templates are simple strings containing tags enclosed in curly braces.
 * Kurly only provides the parsing and compiling logic. You provide the tags.
 * 
 * Example
 * -------
 * 
 * // The template
 * var str = "This is a {cool example of {sub} tags}"
 * 
 * // The user-provided tags
 * var tags = {
 *   cool: () => (record, children) => (['great'].concat(children)),
 *   sub: () => ({type}) => [`nested ${type}`]
 * }
 * 
 * // Use `parse` to parse the template into an AST
 * var parsed = parse(str, tags)
 * 
 * // parsed will look like:
 * // 
 * // [
 * //   'This is a ', 
 * //   {
 * //     name: cool, 
 * //     tag: function(){..}, 
 * //     text: ' example of {sub} tags', 
 * //     ast: [
 * //       ' example of ', 
 * //       {
 * //         name: 'sub',
 * //         tag: function(){..},
 * //         text: null,
 * //         ast: []
 * //       }, 
 * //       ' tags'
 * //     ]
 * //   }
 * // ]
 * //
 * 
 * // Use `compile` to compile an AST into a function
 * var execute = compile(ast)
 * 
 * // Call the function! You may supply a context object as the first parameter 
 * // and it will be available in all the tags
 * var results = execute({ type: 'kurly'})
 * 
 * // results will look like:
 * // ['This is a ', 'great', ' example of ', 'nested kurly', ' tags']
 * 
 * // You can simply `join` this array to get a string:
 * var resultString = results.join('')
 * 
 * // resultString will look like:
 * // 'This is a great example of nested kurly tags'
 */

var log = require('anylogger')('kurly')

module.exports = {
  parse,
  compile,
}

/**
 * Parses a string with template tags in it into an abstract syntax tree.
 * 
 * @param {String} str The string to parse, may be null or undefined
 * @param {Object} tags An object with tag names as keys and tag functions as values
 * 
 * @returns An array, possibly empty but never null or undefined.
 */
function parse(str) {
  log.debug('parse', str)
  var result = [], error
  try {
    if (!str) return result
    if (process.env.NODE_ENV !== 'production') {
      if (typeof str != 'string') throw new Error('parameter `str` must be a string')
    }
    var tag, s = str, result = []
    while (tag = nextTag(s)) {
      var before = s.substring(0, tag.idx)
      if (before) result.push(before)
      result.push({
        name: tag.name,
        text: tag.text,
        ast: parse(tag.text)
      })
      s = s.substring(tag.end + 1)
    }
    if (s) result.push(s)
    return result
  } catch(e) {
    error = e
    throw e
  } finally {
    log.debug('parse', '=>', error ? error : result)
  }
}


/**
 * Compiles an abstract syntax tree into a function
 * 
 * @param {Array<String|Object>} ast An abstract syntax tree created with `parse`
 * @param {Object} tags An object of tags keyed by tag name
 * @param {Function} parent Optionally, a compiled parent function for the ast
 * 
 * @returns An array, possibly empty but never null or undefined.
 */
function compile(ast, tags, parent) {
  log.debug('compile', ast, tags && Object.keys(tags).join(',') || tags, parent)
  var result, error
  try {
    if (process.env.NODE_ENV !== 'production') {
      if ((ast === undefined) || (ast === null)) throw new Error('parameter `ast` is required')
      if (! Array.isArray(ast)) throw new Error('parameter `ast` must be an array')
      if ((tags === undefined) || (tags === null)) throw new Error('parameter `tags` is required')
      if (typeof tags != 'object') throw new Error('parameter `tags` must be an object')
    }
  // recursively compile the ast
    var nodes = ast.map(n => 
      typeof n == 'string' ? n : 
      compile(n.ast, tags, 
        tags[n.name] ? tags[n.name](n) :
        tags['*'] ? tags['*'](n) : 
        undefined
      )
    )
    // return a function that, when called, will render the result
    var result = function(rec) {
      var results = nodes.reduce(function(r, n){
        if (typeof n == 'function') n = n(rec)
        if (!Array.isArray(n)) n = [n]
        r.push.apply(r, n)
        return r
      }, [])
      return parent ? parent(rec, results) : results
    }
    return result;
  } catch(e){
    error = e
    throw e
  } finally {
    log.debug('compile', '=>', error ? error : result)
  }
}


function nextTag(str) {
  var match = str.match(/\{[_a-zA-Z][_a-zA-Z0-9]*([^_a-zA-Z0-9].*)?\}/)
  if (!match) return
  var s = match[0]
  var name = match[1] ? s.substring(1, s.indexOf(match[1])) : s.substring(1, s.indexOf('}'))
  log('nextTag', 'name', name, 'str', str, 'match', match)
  var result = { name, idx: match.index, end: -1, text: '' }
  // loop through the string, parsing it as we go through it
  var esc = false
  var open=1 // open brace at match.index 
  for (var i=match.index+name.length+1; i<str.length; i++) {
    var token = str[i]
    if (esc) {
      token = (token == 'n') ? '\n' :
              (token == 't') ? '\t' :
              (token == '{') ||
              (token == '}') ||
              (token == '\\') ? token :
              '\\' + token // unrecognized escape sequence is ignored
    }
    else {
      if (token === '{') {
        open++
      }
      if (token === '}') {
        open--
        if (!open) {
          result.end = i
          return result
        }
      }
      if (token === '\\') {
        esc = true
        continue
      }
      if (!result.text && (token.search(/\s/)===0)) {
        continue
      }
    }
    result.text += token
    esc = false
  }
}
