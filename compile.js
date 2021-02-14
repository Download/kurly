var pipe = require('./pipe')
var tag = require('./tag')

/**
 * Compiles an abstract syntax tree into a function
 *
 * @param {Array<String|Object>} ast An abstract syntax tree created with `parse`
 * @param {Object} tags An object of tags keyed by tag name
 * @param {Object} rec Optionally, a static record for static tags
 *
 * @returns An array, possibly empty but never null or undefined.
 */
function compile(ast, tags, rec) {
  if (process.env.NODE_ENV != 'production') {
    if ((ast === undefined) || (ast === null)) throw new Error('parameter `ast` is required')
    if (! Array.isArray(ast)) throw new Error('parameter `ast` must be an array')
    if ((tags === undefined) || (tags === null)) throw new Error('parameter `tags` is required')
    if (typeof tags != 'object') throw new Error('parameter `tags` must be an object: ' + typeof tags)
    if (Array.isArray(tags)) throw new Error('parameter `tags` must be an object: array')
    if (rec && (typeof rec != 'object')) throw new Error('parameter `rec` must be an object: ' + typeof rec)
    if (Array.isArray(rec)) throw new Error('parameter `rec` must be an object: array')
  }

  return tag(pipe(ast, tags, rec), rec);
}

compile.default = compile
module.exports = compile
