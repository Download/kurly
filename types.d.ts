/**
 * Represents a possible tag. It includes fields to store
 * the tag `open` marker, it's `name`, any `sep` whitespace, the
 * tag content `text`, the `close` marker and a parsed `ast` of
 * it's content text.
 */
export interface Node extends Object {
  open: string,
  name: string,
  sep: string,
  text: string,
  close: string,
  ast: Ast,
}

/**
 * A node that is 'instantiated'. That is, a `Tag` was found that matched
 * it's name (or a wildcard tag was found) and that tag was invoked to
 * create a `TagFn`, stored in property `tag` on the node.
 */
export interface PipeNode extends Node {
  tag: TagFn,
}

/**
 * An Abstract Syntax Tree. An array of strings or `Node`s, where a `Node`
 * has a field `ast` that contains the ast of it's children.
 */
export type Ast = Array<Node | string>

/**
 * An instantiated ast, where all nodes have a populated `tag` field.
 */
export type Pipe = Array<PipeNode | string>

/**
 * A function that accepts a dynamic record object and
 * returns some output
 */
export type DynamicTagFn = (rec: object) => any

/**
 * A function that accepts no arguments and optionally
 * uses a static record object in it's output only.
 */
export type StaticTagFn = () => any

/**
 * Either a static or a dynamic tag function.
 */
export type TagFn = DynamicTagFn | StaticTagFn

/**
 * Converts a `PipeNode` to a `TagFn`
 */
export type toTagFn = (node: PipeNode) => TagFn

/**
 * A function that accepts an ast `Node` and
 * returns a dynamic tag function.
 */
export type DynamicTag = (ctx: Node) => DynamicTagFn

/**
 * A function that accepts an ast `Node` and an optional static
 * record object and returns a static tag function.
 */
export type StaticTag = (ctx: Node, rec?: object) => StaticTagFn

/**
 * Either a dynamic or a static tag.
 */
export type Tag = DynamicTag | StaticTag

/**
 * A dictionary object where each key's name is a `string`
 * to match tag names to and each key's value is a `Tag`. One special
 * entry is the wildcard tag at which has key name `'*'`.
 */
export type Tags = {
  [key : string]: Tag;
}

/**
 * Parse options.
 */
export type Options = {

  /**
   * Whether open/close markers are optional
   */
  optional?: boolean,

  /**
   * The character to use as open marker
   */
  open?: string,

  /**
   * The character to use as close marker
   */
  close?: string
}
