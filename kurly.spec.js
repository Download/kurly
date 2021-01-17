require('ulog')
var log = require('anylogger')('kurly:spec')
var chai = require('chai')
var chaiSubset = require('chai-subset');
chai.use(chaiSubset);
var expect = chai.expect

var { parse, compile } = require('./')
var pipe = require('./pipe')
var tag = require('./tag')
var children = require('./children')

log('Starting tests')

describe('API', () => {

  describe('parse(str, [options]) => ast', () => {
    it('is a function', () => {
      expect(parse).to.be.a('function')
    })
    it('accepts 2 arguments', () => {
      expect(parse).property('length').to.equal(2)
    })
    it('returns an abstract syntax tree (ast)', () => {
      expect(parse('string')).to.be.an('array')
    })

    describe('str', () => {
      it('is a string', () => {
        expect(() => parse('string')).to.not.throw()
        expect(() => parse(8)).to.throw()
        expect(() => parse({object:''}, {})).to.throw()
        expect(() => parse(['array'], {})).to.throw()
      })
      it('may be null or undefined', () => {
        expect(() => parse(null)).to.not.throw()
        expect(() => parse(undefined)).to.not.throw()
      })
    })

    describe('[options]', () => {
      it('is an object', () => {
        expect(() => parse('string', {})).to.not.throw()
        expect(() => parse('string', true)).to.throw()
        expect(() => parse('string', 8)).to.throw()
        expect(() => parse('string', 'string')).to.throw()
        expect(() => parse('string', ['array'])).to.throw()
      })
      it('is optional', () => {
        expect(() => parse('string')).to.not.throw()
      })
      it('may be null or undefined', () => {
        expect(() => parse('string', null)).to.not.throw()
        expect(() => parse('string', undefined)).to.not.throw()
      })
      it('defaults to undefined', () => {
        expect(parse('string', undefined)).to.deep.equal(parse('string'))
      })
      it('when assigned, sets parse options', () => {
        var actual = parse('a test {string}', {})
        var expected = [
          'a test ',
          { open: '{',
            name: 'string',
            sep: '',
            text: '',
            close: '}',
            ast: []
          }
        ]
        expect(actual).to.containSubset(expected)
      })
      it('when field `optional` is set to true, allows tags without open/close markers', () => {
        var actual = parse('a test {string}', { optional: true })
        var expected = [
          { open: '',
            name: 'a',
            sep: '',
            text: '',
            close: '',
            ast: []
          },
          ' ',
          { open: '',
            name: 'test',
            sep: '',
            text: '',
            close: '',
            ast: []
          },
          ' ',
          { open: '{',
            name: 'string',
            sep: '',
            text: '',
            close: '}',
            ast: []
          }
        ]
        expect(actual).to.containSubset(expected)
      })
      it('when option fields `open` and `close` are set, allows tags with different open/close markers', () => {
        var actual = parse('a test <string>', { open: '<', close: '>' })
        var expected = [
          'a test ',
          { open: '<',
            name: 'string',
            sep: '',
            text: '',
            close: '>',
            ast: []
          }
        ]
        expect(actual).to.containSubset(expected)
      })
    })

    describe('=> ast', () => {
      it('is an array of nodes, each of which are either strings or objects', () => {
        var test = 'this is a {test}'
        var result = parse(test)
        expect(result).to.be.an('array')
        expect(result.length).to.eq(2)
        expect(result[0]).to.eq('this is a ')
        expect(result[1]).to.be.an('object')
      })
      it('contains object nodes for all tags found', () => {
        var test = 'a {test} with {tags}'
        var result = parse(test)
        expect(result).to.be.an('array')
        expect(result.length).to.eq(4)
        expect(result[0]).to.eq('a ')
        expect(result[1]).to.be.an('object')
        expect(result[2]).to.eq(' with ')
        expect(result[3]).to.be.an('object')
      })

      describe('object node', () => {
        it('has `open`, `name`, `sep`, `text`, `close` and `ast` fields', () => {
          var test = '{test}'
          var expected = [{ open: '{', name: 'test', sep: '', text: '', close: '}', ast: [] }]
          var actual = parse(test)
          expect(actual).to.containSubset(expected)
        })
        it('contains the full ast of any nested content', () => {
          var test = '{test with {nested {content}}}'
          var expected = [
            { open: '{',
              name: 'test',
              sep: ' ',
              text: 'with {nested {content}}',
              close: '}',
              ast: [
                'with ',
                { open: '{',
                  name: 'nested',
                  sep: ' ',
                  text: '{content}',
                  close: '}',
                  ast: [
                    {
                      open: '{',
                      name: 'content',
                      sep: '',
                      text: '',
                      close: '}',
                      ast: []
                    }
                  ]
                }
              ]
            }
          ]
          var actual = parse(test)
          expect(actual).to.containSubset(expected)
        })
      })
    })
  })

  describe('compile(ast, tags, [rec]) => template', () => {
    it('is a function', () => {
      expect(compile).to.be.a('function')
    })
    it('accepts 3 argument', () => {
      expect(compile).property('length').to.equal(3)
    })
    it('returns a template function', () => {
      expect(compile([],{})).to.be.a('function')
    })

    describe('ast', () => {
      it('is an array', () => {
        expect(() => compile([],{})).to.not.throw()
        expect(() => compile('string', {})).to.throw()
        expect(() => compile(8, {})).to.throw()
        expect(() => compile({}, {})).to.throw()
      })
      it('is required', () => {
        expect(() => compile(null,{})).to.throw()
      })
    })

    describe('tags', () => {
      it('is an object', () => {
        expect(() => compile([], {})).to.not.throw()
        expect(() => compile([], 'string')).to.throw()
        expect(() => compile([], 8)).to.throw()
        expect(() => compile([], ['array'])).to.throw()
      })
      it('is required', () => {
        expect(() => compile([])).to.throw()
        expect(() => compile([], null)).to.throw()
      })
    })

    describe('rec', () => {
      it('is an object', () => {
        expect(() => compile([], {}, {})).to.not.throw()
        expect(() => compile([], {}, 'string')).to.throw()
        expect(() => compile([], {}, 8)).to.throw()
        expect(() => compile([], {}, ['array'])).to.throw()
      })
      it('is optional', () => {
        expect(() => compile([],{})).to.not.throw()
      })
      it('is passed on to the outer tag function during compilaton', () => {
        var expected = {}
        var actual
        var tags = {
          test: (ctx, rec) => {
            actual = rec
            return () => {}
          }
        }
        var ast = [
          { open: '{',
            name: 'test',
            close: '}',
            text: '',
            ast: []
          }
        ]
        compile(ast, tags, expected)
        expect(actual).to.equal(expected)
      })
    })

    describe('=> template(rec)', () => {
      it('is a function', () => {
        var template = compile([], {})
        expect(template).to.be.a('function')
      })
      it('accepts 1 argument', () => {
        var template = compile([], {})
        expect(template.length).to.equal(1)
      })

      describe('rec', () => {
        it('is an object', () => {
          compile(parse('{test}'), {test:()=>(rec)=>{
            expect(rec).to.be.an('object')
          }})
        })
      })
    })
  })


  describe('pipe(ast, tags, [rec]', () => {
    it('is a function', () => {
      expect(pipe).to.be.a('function')
    })

    describe('ast', () => {
      it('is an array', () => {
        expect(() => pipe([],{})).to.not.throw()
        expect(() => pipe('string', {})).to.throw()
        expect(() => pipe(8, {})).to.throw()
        expect(() => pipe({}, {})).to.throw()
      })
      it('is required', () => {
        expect(() => compile(null,{})).to.throw()
      })
    })

    describe('tags', () => {
      it('is an object', () => {
        expect(() => compile([], {})).to.not.throw()
        expect(() => compile([], 'string')).to.throw()
        expect(() => compile([], 8)).to.throw()
      })
      it('is required', () => {
        expect(() => compile([])).to.throw()
        expect(() => compile([], null)).to.throw()
      })
    })

})

  describe('Wildcard tag', () => {
    it('is registered under the name \'*\'', () => {
      var called, ast = parse('{test}')
      var catchAll = () => () => (called = true)
      var template = compile(ast, { '*': catchAll })
      template()
      expect(called).to.equal(true)
    })

    it('is called for unmatched tags', () => {
      var ast = parse('{a}, {b}, {c}.')
      var catchAll = ({name}) => ({greet}) => `${greet} ${name}`
      var template = compile(ast, { '*': catchAll })
      var result = template({ greet: 'Hi' })
      var expected = ['Hi a', ', ', 'Hi b', ', ', 'Hi c', '.']
      expect(result).to.deep.equal(expected)
    })
  })

  describe('Scenarios', () => {
    describe('README', () => {
      it('"{noun} {verb} {adjective}!"', () => {
        var ast = parse('{noun} {verb} {adjective}!')
        var tags = { '*': ({name}) => (rec) => `${rec[name]}` }
        var template = compile(ast, tags)
        var record = { noun: 'Kurly', verb: 'is', adjective: 'easy' }
        var output = template(record)  // ['Kurly', ' ', 'is', ' ', 'easy', '!']
        expect(output).to.deep.equal(['Kurly', ' ', 'is', ' ', 'easy', '!'])
        expect(output.join('')).to.equal('Kurly is easy!')
      })
      it('"This is a {cool example of {sub} tags}"', () => {
        var test = 'This is a {cool example of {sub} tags}'
        var expected = [
          'This is a ',
          { open: '{',
            name: 'cool',
            sep: ' ',
            text: 'example of {sub} tags',
            close: '}',
            ast: [
              'example of ',
              { open: '{',
                name: 'sub',
                sep: '',
                text: '',
                close: '}',
                ast: []
              },
              ' tags'
            ],
          }
        ]
        var actual = parse(test)
        expect(actual).to.containSubset(expected)
        var template = compile(actual, {
          // the 'cool' tag supports nesting via the `children` parameter
          // ctx.sep contains any whitespace between the tag name and the
          // children that was removed during parsing
          cool: (ctx) => ({children}) => ['great' + ctx.sep ].concat(children),
          // the 'sub' tag uses a parameter `type`
          sub: () => ({type}) => `nested ${type}`
        })

        it('"a {tag with a closing curly brace \} in it}"', () => {
          expect(() => parse('a {tag with a closing curly brace \} in it}')).to.not.throw()
        })

        // Call the function! You may supply a context object as the first parameter
        // and it will be available in all the tags
        var results = template({ type: 'kurly'})

        // results will look like:
        // ['This is a ', 'great ', 'example of ', 'nested kurly', ' tags']
        var expected = ['This is a ', 'great ', 'example of ', 'nested kurly', ' tags']
        expect(results).to.deep.equal(expected)
      })
    })
    describe('Required vs optional open/close markers', () => {
      it('"this is a {test}: {hello, {world}!}"', () => {
        var test = 'this is a {test}: {hello, {world}!}'
        var expected = ['this is a ', 'TEST', ': ', 'Hello', ', ', 'Earth', '!']
        var tags = {
          test: () => r => 'TEST',
          hello: () => ({children}) => ['Hello'].concat(children),
          world: () => ({planet='World'}) => planet,
        }
        var parsed = parse(test)
        var template = compile(parsed, tags)
        expect(template).to.be.a('function')
        var result = template({planet: 'Earth'})
        log('result', result)
        expect(result).to.deep.equal(expected)
      })
      it('"this is a {test}: {hello, {world}!}", { optional: true }', () => {
        var test = 'this is a {test}: {hello, {world}!}'
        var expected = ['this', ' ', 'is', ' ', 'a', ' ', 'TEST', ': ', 'Hello', ', ', 'Earth', '!']
        var tags = {
          test: () => r => 'TEST',
          hello: () => ({children}) => ['Hello'].concat(children),
          world: () => ({planet='World'}) => planet,
          '*': ({ name, open, close }) => (rec) => `${open}${name}${close}`
        }
        var parsed = parse(test, { optional: true })
        var template = compile(parsed, tags)
        expect(template).to.be.a('function')
        var result = template({planet: 'Earth'})
        log('result', result)
        expect(result).to.deep.equal(expected)
      })
      it('"file:./my.config url:https://example.com", { optional: true }', () => {
        var test = 'file:./my.config url:https://example.com'
        var expected = [
          { open: '',
            name: 'file',
            sep: '',
            text: ':./my.config',
            close: '',
            ast: [':./my.config']
          },
          ' ',
          { open: '',
            name: 'url',
            sep: '',
            text: ':https://example.com',
            close: '',
            ast: [':https://example.com']
          }
        ]
        var actual = parse(test, { optional: true })
        expect(actual).to.containSubset(expected)
      })
    })
    describe('Static tags', () => {
      var tags = {
        staticTag: (ctx, rec) => () => `Hello, ${rec.planet}!`,
        staticParent: (ctx, rec) => () => {
          return ['Static parent says: "'].concat(children(ctx, rec)).concat(['"'])
        },
        staticChild: (ctx, rec) => () => 'static ' + rec.planet,
        dynamicChild: (ctx) => (rec) => 'dynamic ' + rec.planet,
      }

      it('can be called without arguments', () => {
        var ast = parse('{staticTag}')
        var rec = { planet: 'World' }
        var template = compile(ast, tags, rec)
        var expected = ['Hello, World!']
        var actual = template()
        expect(actual).to.deep.equal(expected)
      })

      it('support nesting static children', () => {
        var ast = parse('{staticParent Hello, {staticChild}!}')
        var rec = { planet: 'world' }
        var line = pipe(ast, tags, rec)
        expect(pipe.isStatic(line)).to.equal(true)
        var template = compile(ast, tags, rec)
        var expected = ['Static parent says: "', 'Hello, ', 'static world', '!', '"']
        var actual = template()
        expect(actual).to.deep.equal(expected)
      })

      it('support nesting dynamic children', () => {
        var ast = parse('{staticParent Hello, {dynamicChild}!}')
        var rec = { planet: 'world' }
        var line = pipe(ast, tags, rec)
        expect(pipe.isStatic(line)).to.equal(false)
        var template = compile(ast, tags, rec)
        var actual = template()
        var expected = ['Static parent says: "', 'Hello, ', 'dynamic world', '!', '"']
        expect(actual).to.deep.equal(expected)
      })

      it('are converted to dynamic tags automatically when used in dynamic pipes', () => {
        var ast = parse('{staticParent Hello, {dynamicChild}!}')
        var rec = { planet: 'world' }
        var line = pipe(ast, tags, rec)
        expect(pipe.isStatic(line)).to.equal(false)
        var template = compile(ast, tags, rec)
        var actual = template({ planet: 'child' })
        var expected = ['Static parent says: "', 'Hello, ', 'dynamic child', '!', '"']
        expect(actual).to.deep.equal(expected)
      })

    })
  })
})
