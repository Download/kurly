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
 * // Use `parse` to parse the template into an AST
 * var parsed = parse(str)
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
 * // Use `compile` to compile an AST into a template function
 * var template = compile(ast, {
 *   // the 'cool' tag supports nesting via the `children` parameter
 *   cool: () => ({children}) => ['great'].concat(children),
 *   // the 'sub' tag uses a parameter `type`
 *   sub: () => ({type}) => `nested ${type}`
 * })
 * 
 * // Call the function! You may supply a context object as the first parameter 
 * // and it will be available in all the tags
 * var results = template({ type: 'kurly'})
 * 
 * // results will look like:
 * // ['This is a ', 'great', ' example of ', 'nested kurly', ' tags']
 */
module.exports = {
  parse: parse,
  compile: compile,
}

if (process.env.NODE_ENV != 'production') {
  var log = require('anylogger')('kurly')
}

/**
 * Parses a string with template tags in it into an abstract syntax tree.
 * 
 * @param {String} str The string to parse, may be null or undefined
 * 
 * @returns An array, possibly empty but never null or undefined.
 */
function parse(str) {
  if (process.env.NODE_ENV != 'production') {
    log.debug('parse', str)
  }
  var tag, result = []
  if ((str !== null) && (str !== undefined)) {
    if (process.env.NODE_ENV != 'production') {
      if (typeof str != 'string') throw new TypeError('`str` is not a string: ' + typeof str)
    }
    while (tag = nextTag(str)) {
      var before = str.substring(0, tag.index)
      if (before) result.push(before)
      result.push({
        name: tag.name,
        text: tag.text,
        ast: parse(tag.text)
      })
      str = str.substring(tag.end + 1)
    }
    if (str) result.push(str)
  }
  if (process.env.NODE_ENV != 'production') {
    log('parse', str, '=>', result)
  }
  return result
}

/**
 * Finds the next tag in the given `str` and returns a record with the tag
 * name, the index where it starts in the string, the index where it ends
 * and the text contained in the body of the tag. 
 * 
 * @param {String} str The string to search in
 * @returns {Object} The tag info object, or `undefined` if no tags were found.
 */
function nextTag(str) {
  var match = str.match(/\{[_a-zA-Z][_a-zA-Z0-9]*([^_a-zA-Z0-9].*)?\}/)
  var result
  if (match) {
    var name = match[1] ? match[0].substring(1, match[0].indexOf(match[1])) : match[0].substring(1, match[0].indexOf('}'))
    result = { name: name, index: match.index, end: -1, text: '' }
    // loop through the string, parsing it as we go through it
    var esc = false
    var open=1 // we already found one open brace
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
            break
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
  return result
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
  if (process.env.NODE_ENV != 'production') {
    log.debug('compile', ast, tags, parent)
    if ((ast === undefined) || (ast === null)) throw new Error('parameter `ast` is required')
    if (! Array.isArray(ast)) throw new Error('parameter `ast` must be an array')
    if ((tags === undefined) || (tags === null)) throw new Error('parameter `tags` is required')
    if (typeof tags != 'object') throw new Error('parameter `tags` must be an object')
  }

  // recursively compile the ast
  var nodes = ast.map(function(n){ 
    return typeof n == 'string' 
        ? n : 
        compile(n.ast, tags, 
          tags[n.name] ? tags[n.name](n) :
          tags['*'] ? tags['*'](n) : 
          undefined
        )
  })

  // create the result function
  var result = function(rec) {
    // clone rec into res
    var res = {}
    for (k in rec) res[k] = rec[k]
    // get the result children
    res.children = nodes.reduce(function(r, n){
      if (typeof n == 'function') n = n(rec)
      r.push.apply(r, Array.isArray(n) ? n : [n])
      return r
    }, [])
    // invoke parent if we have it
    return parent ? parent(res) : res.children
  }
  if (process.env.NODE_ENV != 'production') {
    log('compile', ast, tags, parent, '=>', '[Function]')
  }
  return result;
}


