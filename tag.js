function tag(pipe, rec, parent) {
  var nodes = pipe.map(tag.toFn(rec))

  // create the result function
  return function(rc) {
    // allow for static invocation (without arguments)
    rc = rc || rec
    // clone rec into res
    var res = {}
    for (k in rc) res[k] = rc[k]
    // get the result children
    res.children = nodes.reduce(function(r, n){
      if (typeof n == 'function') n = n(rc)
      r.push.apply(r, Array.isArray(n) ? n : [n])
      return r
    }, [])
    // invoke parent if we have it
    return parent ? parent(res) : res.children
  }
}

tag.toFn = function(rec) {
  return function(node){
    return node && node.tag ? tag(node.ast, rec, node.tag) : node
  }
}

tag.default = tag
module.exports = tag
