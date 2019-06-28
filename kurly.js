/**
 * kurly - Pluggable templating engine for Node and browsers
 * =========================================================
 * 
 * Kurly is a small and simple, yet powerful templating engine for node and browsers.
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
  compile
}

/**
 * Parses a string with template tags in it into an abstract syntax tree.
 * 
 * @param {String} str The string to parse, may be null or undefined
 * @param {Object} tags An object with tag names as keys and tag functions as values
 * 
 * @returns An array, possibly empty but never null or undefined.
 */
function parse(str, tags) {
  log.debug('parse', str, tags && Object.keys(tags).join(',') || tags)

  var result = [], error
  try {
    if (!str) return result

    if (process.env.NODE_ENV !== 'production') {
      if (typeof str != 'string') throw new Error('parameter `str` must be a string')
      if ((tags === undefined) || (tags === null)) throw new Error('parameter `tags` is required')
      if (typeof tags != 'object') throw new Error('parameter `tags` must be an object')
    }

    var tag, s = str, result = []
    while ((tag = nextTag(s, tags)) !== null) {
      var start = tag.idx + tag.name.length + 1
      var before = s.substring(0, tag.idx)
      if (before) {result.push(before)}
      var skipped = s.substring(tag.idx, start)
      var remaining = s.substring(start)
      var body = tagBody(remaining)
      if (body) {
        result.push({
          name: tag.name,
          tag: tags[tag.name],
          text: body.text,
          ast: parse(body.text, tags)
        })
        s = remaining.substring(body.end + 1)
      }
      else { // invalid, return original text
        result.push(skipped + remaining)
      }
    }
    if (s) {result.push(s)}
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
 * @param {Array} ast An ast created with `parse`
 * @param {Function} parent Optionally, a compiled parent function for the ast
 * 
 * @returns An array, possibly empty but never null or undefined.
 */
function compile(ast, parent) {
  log.debug('compile', ast, parent)

  // recursively compile the ast
  var nodes = ast.map(n => typeof n == 'string' ? n : compile(n.ast, n.tag(n)))

  // return a function that, when called, will render the result
  return function(rec) {
    var results = nodes.reduce(function(r, n){
      if (typeof n == 'function') n = n(rec)
      if (!Array.isArray(n)) n = [n]
      r.push.apply(r, n)
      return r
    }, [])
    // if we have a parent, invoke that and pass our results to it
    return parent ? parent(rec, results) : results
  }
}


const literal = ({ text }) => () => text


function nextTag(str, tags) {
  var next = {name:null, idx:-1}
  Object.keys(tags).forEach(function(tag){
		var exp = new RegExp('\\{' + escape(tag) + '.*\\}')
		var idx = str.search(exp)
		if ((idx !== -1) && ((next.idx === -1) || (idx < next.idx)) && (str[idx+tag.length+1])) {
			next.idx = idx
			next.name = tag
		}
  })
	for (var i=0,tag; tag=tags[i]; i++) {
		var exp = new RegExp(escape(tag)) // new RegExp(tag.replace('.', '\\.') + '{.*}')
		var idx = str.search(exp)
		if ((idx !== -1) && ((next.idx === -1) || (idx < next.idx)) && (str[idx+tag.length+1])) {
			next.idx = idx
			next.name = tag
		}
	}
	return next.name ? next : null
}

function tagBody(str) {
	// loop through the string, parsing it as we go through it
	var result = {text:null, end:-1}
	var inString=false
	var esc = false
	var open=0
	var whitespace = /\s/
	for (var i=0; i<str.length; i++) {
		var token = str[i]
		if (!inString) {
			if (token === '{') {
				open++
			}
			if (token === '}') {
				if (!open) {
					result.end = i
					if (result.text && result.text[0] === '\'' && result.text[result.text.length-1] === '\'') {
						result.text = result.text.substring(1, result.text.length-1)
					}
					return result
				}
				open--
			}
			if (token === '\'') {
				inString = true
				if (esc) {continue}
			}
			if (result.text===null && token.search(whitespace)===0) {continue}
		}
		else { // inString
			if (token === '\'') {
				inString = false
				esc = true
			}
		}
		if (result.text === null) {
			result.text = ''
		}
		result.text += token
		esc = false
	}
	return null
}










function convertQuotes(payload) {
	if (!payload || typeof payload != 'string') {return payload}
	var result = ''
	var inString = false
	var esc = false
	for (var i=0; i<payload.length; i++) {
		var token = payload[i]
		if (inString) {
			if (token === '\'') {
				if (esc) {
					// 2 consecutive quotes inside a string are escaped to a single quote
					result += '\''
					esc = false
				}
				else {
					// encountered a quote... might be first of multiple, flag but do nothing yet
					esc = true
				}
			}
			else {
				if (esc) {
					// the previous quote stands on it's own, so it's a string terminator
					result += '"'
					inString = false
				}
				esc = false
				result += token
			}
		}
		else { // ! inString
			if (token === '\'') {
				result += '"'
				inString = true
			}
			else {
				result += token
			}
		}
	}
	if (esc) {
		result += '"'
	}
	log.debug('convertQuotes(' + payload + ') ==> ', result)
	return result
}

function escape(regex) {
	return regex.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}