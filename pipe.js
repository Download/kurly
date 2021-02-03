if (process.env.NODE_ENV != 'production') {
  var log = require('anylogger')('kurly:pipe')
}

function pipe(ast, tags, rec) {
  if (process.env.NODE_ENV != 'production') {
    log.debug(ast, tags, rec)
    if ((ast === undefined) || (ast === null)) throw new Error('parameter `ast` is required')
    if (! Array.isArray(ast)) throw new Error('parameter `ast` must be an array')
    if ((tags === undefined) || (tags === null)) throw new Error('parameter `tags` is required')
    if (typeof tags != 'object') throw new Error('parameter `tags` must be an object: ' + typeof tags)
    if (Array.isArray(tags)) throw new Error('parameter `tags` must be an object: array')
    if (rec && (typeof rec != 'object')) throw new Error('parameter `rec` must be an object: ' + typeof rec)
    if (Array.isArray(rec)) throw new Error('parameter `rec` must be an object: array')
  }

  var result = ast.map(function(n){
    if (!n || !n.ast) return n
    var tag = tags[n.name] || tags['*']
    if (!tag) return n.open + n.name + n.sep + n.text + n.close
    var ctx = {}
    for (var prop in n) ctx[prop] = n[prop]
    ctx.ast = pipe(n.ast, tags, rec)
    if (typeof tag == 'function') {
      if (tag.length == 2) {
        // static tag
        if (rec && pipe.isStatic(ctx.ast)) {
          // in a static pipe
          ctx.tag = tag(ctx, rec)
          ctx.tag.toString = ctx.tag
        } else {
          // in a dynamic pipe
          ctx.tag = function(rec){
            return tag(ctx, rec)()
          }
        }
      } else {
        // dynamic tag
        ctx.tag = tag(ctx)
      }
    } else {
      ctx.tag = tag
    }
    return ctx
  })

  if (process.env.NODE_ENV != 'production') {
    log.debug(ast, tags, rec, '=>', result)
  }

  return result
}

pipe.isStatic = function(ast) {
  return ast.reduce(function(r,n){
    return r && ((typeof n == 'string') || (typeof n.tag != 'function') || (n.tag.toString === n.tag))
  }, true)
}

pipe.default = pipe
module.exports = pipe
