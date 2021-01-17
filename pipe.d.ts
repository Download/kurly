import { Ast, Tags, Pipe } from './types'

/**
 * Creates a `Pipe` from an ast.
 *
 * Instead of using `compile()`, to compile an ast directly
 * into a `TagFn`, you can use `pipe()` to create a `Pipe`,
 * which is an enhanced `Ast` containing `PipeNode`s, which
 * are `Node`s that have a `tag` property populated to a
 * `TagFn`. You can then call `tag()` on that pipe to get
 * basically the same result as you would have gotten from
 * `compile()`, or you can choose to do something else
 * entirely with that pipe.
 *
 * @param ast The ast to create a pipe from.
 * @param tags The tags to use in the pipe.
 * @param rec Optional static record object
 */
declare function pipe(ast: Ast, tags: Tags, rec?: object): Pipe

export = pipe
export default pipe
