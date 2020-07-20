# kurly <sub><sup>0.7.0</sup></sub>

![kurly](kurly.png)

### Tiny pluggable templating engine for Node and browsers

[![npm](https://img.shields.io/npm/v/kurly.svg)](https://npmjs.com/package/kurly)
[![license](https://img.shields.io/npm/l/kurly.svg)](https://creativecommons.org/licenses/by/4.0/)
[![travis](https://img.shields.io/travis/Download/kurly.svg)](https://travis-ci.org/Download/kurly)
![mind BLOWN](https://img.shields.io/badge/mind-BLOWN-ff69b4.svg)

<sup><sub><sup><sub>.</sub></sup></sub></sup>

![girly](girly.png)

`kurly` is a tiny  ~[577](#gzip-size) bytes pluggable templating engine for 
Node and browsers. It can parse templates with tags in curly braces to
abstract syntax trees, which it can then compile into functions.


## Download

* [kurly.js](https://unpkg.com/kurly@0.7.0/kurly.js) 
  (fully commented source ~7kB)
* [kurly.min.js](https://unpkg.com/kurly@0.7.0/kurly.min.js) 
  (~[577](#gzip-size) bytes minified and gzipped)


## CDN

*index.html*
```html
<script src="https://unpkg.com/kurly@0.7.0/kurly.min.js"></script>
<script>(function(){ // IIFE
  var ast = kurly.parse('{noun} {verb} {adjective}!')
  var tags = { '*': ({name}) => (rec) => `${rec[name]}` }
  var template = kurly.compile(ast, tags)
  var record = { noun: 'Kurly', verb: 'is', adjective: 'easy' }
  var output = template(record)  // ['Kurly', ' ', 'is', ' ', 'easy', '!']
  console.info(output.join('')) // > "Kurly is easy!"
})()</script>
```


## Install

```sh
npm install --save kurly
```


## Require

```js
// using ES5 syntax with CommonJS
var kurly = require('kurly')
var parse = kurly.parse
var compile = kurly.compile 

// or, using ES2015 with CommonJS
var { parse, compile } = require('kurly')
```


## Import

```js
// Using ES2015 import on Node or with Babel transpilation
import { parse, compile } from 'kurly'
```


## Use

Call `parse` to parse text with tags denoted with curly braces into an abstract syntax tree:

```js
var ast = parse('Hello, {kurly}')
```

Call `compile` with the ast and an object with tag functions (see [Tags](#tags)):

```js
var template = compile(ast, {
  kurly: () => ({ planet }) => `${planet}!`
})
```

Call the resulting function, passing it a record with parameters:

```js
var result = template({ planet: 'World' }) // ['Hello, ', 'World!']
```


## Tags

`kurly` is just a tiny parser / compiler. Any functionality should be
provided by tags. The way this works is simple: `kurly` parses and 
finds tags during the `parse` phase and builds an ast. Then during
`compile` it replaces the tags it found in the ast with the tag
functions it was given.

### Tag syntax
`kurly` uses a regular expression to match tags:

```js
/\{[_a-zA-Z][_a-zA-Z0-9]*([^_a-zA-Z0-9].*)?\}/
```

This expression matches an open curly brace followed by an identifier
and either some content text starting with a non-identifier character
followed by a closing curly brace, or directly followed by a closing
curly brace.

Tag identifiers can not contain any special characters such as punctuation,
diacritics, whitespace, unicode symbols etc. They must start with an uppercase
or lowercase letter or the underscore and may be followed by zero or more
alphanumerical characters. Any text following the identifier is parsed and
escaping is applied. A tag can contain a closing curly brace as content by 
escaping it. The string `"a {tag with a closing curly brace \} in it}"` will
be parsed correctly.

### Creating tags
To create a kurly tag, we create a *higher order function*; a function that
returns a function:

```js
function outer(cfg) {
  return function inner(rec) {
    return `My first ${rec.thing}`
  }
}
```

**The outer function** is called during the compilation phase.
It is passed a configuration object containing the tag name and function,
the tag content text and an abstract syntax tree of it's children
(see [Nested tags](#nested-tags)).
Any expensive work that needs to be done only once can be done here.

**The inner function** is called during the render phase.
It returns an (array of) output(s). The output entries can be any type. It's
argument is an object that was initialized when the compiled function was
called. One key is always added to this object: `children`. This contains the
rendered output of the children and can be used in the tag output.

### Nested tags
Kurly supports nested tags:

```js
var ast = parse('{greeting, {kurly}}')
var template = compile(ast, { 
  greeting: () => ({ children }) => ['Hello'].concat(children),
  kurly: () => () => 'World!'
})
var result = template() // ['Hello', ', ', 'World!']
```

For a tag to support nesting, it should pick up it's children and add them
to the result it is returning. In the example above, `greeting` is adding
it's children to the array it is returning using `concat`.

### Wildcard tag
You can register a wildcard / catch-all tag under the name `'*'` that will 
be called for everything that matches the tag syntax, but for which no 
registered tag was found:

```js
var ast = parse('{a}, {b}, {c}.')
var catchAll = ({name}) => ({greet}) => `${greet} ${name}`
var template = compile(ast, { '*': catchAll })
var result = template({ greet: 'Hi' })  
// result: ['Hi a', ', ', 'Hi b', ', ', 'Hi c', '.']
```

### Tag return value
A tag may return just about anything. Eventually, all the return values of
all the tags will end up in a flattened array, which is returned by the 
template function, together with all the unmatched text, in the right order.

If you need the end result to be a string and all your tags are returning
(arrays of) strings, you can convert the template result to a string like
this:

```js
result = result.join('')
```

### Share your tags
Created a nice tag and want to share it with the world?
Publish it to NPM! Make sure to include the keyword `"kurly"` in your 
`package,json` so it will show up in the list of 
[projects related to kurly](https://www.npmjs.com/search?q=keywords:kurly).


## Issues

Add an issue in the [issue tracker](https://github.com/download/kurly/issues)
to let me know of any problems you find, or questions you may have.


## Copyright

Copyright 2019 by [Stijn de Witt](https://stijndewitt.com). Some rights reserved.


## License

Licensed under the [Creative Commons Attribution 4.0 International (CC-BY-4.0)](https://creativecommons.org/licenses/by/4.0/) Open Source license.


## gzip-size

The GZIP algorithm is available in different flavours and with different 
possible compression settings. The sizes quoted in this README have been
measured using [gzip-size](https://npmjs.com/package/gzip-size) 
by [Sindre Sorhus](https://github.com/sindresorhus), your mileage may vary.
