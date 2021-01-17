function children(ctx, rec){
  return rec.children ? rec.children : ctx.ast.map(n =>
    typeof n == 'string' ? n : typeof n.tag == 'function' ? n.tag(rec) : n.tag
  )
}

children.default = children
module.exports = children
