import { Ast, Tags, TagFn } from './types'

/**
 * Compiles an ast into a `TagFn`.
 *
 * This function will create a `Pipe` from the ast and tags
 * by calling `pipe()`, and then will create a single `TagFn`
 * from the pipe by calling `tag()`, and return that.
 *
 * @param ast The ast to compile
 * @param tags The tags to use
 * @param rec Optional static record object
 */
declare function compile(ast: Ast, tags: Tags, rec?: object): TagFn

export = compile
export default compile
