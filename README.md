![kurly](kurly.png)

### Tiny pluggable templating engine for Node and browsers

[![npm](https://img.shields.io/npm/v/kurly.svg)](https://npmjs.com/package/kurly)
[![license](https://img.shields.io/npm/l/kurly.svg)](https://creativecommons.org/licenses/by/4.0/)
[![travis](https://img.shields.io/travis/Download/kurly.svg)](https://travis-ci.org/Download/kurly)
[![greenkeeper](https://img.shields.io/david/Download/kurly.svg)](https://greenkeeper.io/)
![mind BLOWN](https://img.shields.io/badge/mind-BLOWN-ff69b4.svg)

<sup><sub><sup><sub>.</sub></sup></sub></sup>

![girly](girly.png)

`kurly` is a tiny pluggable templating engine for Node and browsers. It can 
parse templates with tags in curly braces to an abstract syntax tree, which 
it can then compile into functions.

## Install

```sh
npm install --save kurly
```

## Require

```js
var { parse, compile } = require('kurly')
```

## Import

```js
import { parse, compile } from 'kurly'
```

## Use

```js
var template = 'Hello, {kurly}'
var tags = { 
  kurly: () => () => 'World!'
}
var ast = parse(template)
var template = compile(ast, tags)
var result = template() // ['Hello, ', 'World!']
```

## Tags

To create a kurly tag, we create a *higher order function*; a function that 
returns a function:

```js
function outer() {
  return function inner() {
    return 'My first kurly tag!'
  }
}
```

The outer function is called during the compilation phase and is passed a
configuration object containing the tag name and function and an abstract 
syntax tree of it's children (see [Nested tags](#nested tags)). 
Any expensive work that needs to be done only once can be done here.

The inner function is called during the render phase. It returns a(n array of)
string(s). 

### Nested tags
Kurly supports nested tags:

```js
var template = '{greeting, {kurly}}'
var tags = { 
  greeting: () => ({ children }) => ['Hello'].concat(children),
  kurly: () => () => 'World!'
}
var ast = parse(template)
var template = compile(ast, tags)
var result = template() // ['Hello', ', ', 'World!']
```

For a tag to support nesting, it should pick up it's children and add them
to the result it is returning. In the example above, `greeting` is adding
it's children to the array it is returning using `concat`.


## Issues

Add an issue in the [issue tracker](https://github.com/download/ulog/issues)
to let me know of any problems you find, or questions you may have.


## Copyright

Copyright 2019 by [Stijn de Witt](https://stijndewitt.com). Some rights reserved.


## License

Licensed under the [Creative Commons Attribution 4.0 International (CC-BY-4.0)](https://creativecommons.org/licenses/by/4.0/) Open Source license.
