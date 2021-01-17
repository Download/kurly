import { Pipe, TagFn, toTagFn } from './types'

/**
 * Compiles a `Pipe` into a single `TagFn`
 *
 * @param pipe The pipe to compile
 * @param rec Optional static record object
 * @param parent Optional parent `TagFn`
 */
declare function tag(pipe: Pipe, rec?: object, parent?: TagFn): TagFn

tag.toFn = (rec?: object) => toTagFn

export = tag
export default tag
