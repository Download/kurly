import { Ast, Pipe, Node, Tag, TagFn, Tags } from './types'
// old style
import kurly from './'
var parse = kurly.parse
// new style
import compile from './compile'
import pipe from './pipe'
import tag from './tag'
import children from './children'

var ast: Ast = parse('Hello')
for (var i=0; i<ast.length; i++) {
  var element: Node | string = ast[i]
  if (typeof element == 'string') {
    var str: string = element
  } else {
    var node: Node = element
  }
}

var ast: Ast = parse('This is a {string} {with} {tags}')
for (var i=0; i<ast.length; i++) {
  var element: Node | string = ast[i]
  if (typeof element == 'string') {
    var str: string = element
  } else {
    var node: Node = element
  }
}
var myTag: Tag = (ctx: Node) => (rec: object) => 'template'
var tags: Tags = {
  'string': myTag,
  'with': (ctx: Node) => (rec: object) => 'containing',
  'tags': () => () => 'kurly tags',
}
var rec = {}
var template: TagFn = compile(ast, tags)
var result = template(rec)

var myTag: Tag = (ctx: Node) => (rec: object) => ['template'].concat(children(ctx, rec))
var tags: Tags = {
  'string': myTag,
  'with': (ctx: Node) => (rec: object) => 'containing',
  'tags': () => () => 'kurly tags',
}
var rec = {}
var line: Pipe = pipe(ast, tags, { type: 'static' })
var template: TagFn = tag(line, rec)
var result = template(rec)
