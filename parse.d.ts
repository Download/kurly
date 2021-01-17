import { Ast, Options } from './types'

/**
 * Parses the string `str` to an Ast.
 *
 * If parse `options` are given` they are used to determine
 * whether open/close markers are optional and which characters
 * to use for them. By default `{` and `}` are required.
 *
 * @param str The string to parse
 * @param options Optional parse options.
 */
declare function parse(str: string, options?: Options): Ast

export = parse
export default parse
