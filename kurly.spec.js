require('ulog')
var log = require('anylogger')('kurly:spec')
var expect = require('chai').expect
var { parse, compile } = require('./')

log('Starting tests')

describe('API', () => {

  describe('parse(str) => ast', () => {
    it('is a function', () => {
      expect(parse).to.be.a('function')
    })
    it('accepts 1 argument', () => {
      expect(parse).property('length').to.equal(1)
    })
    it('returns an abstract syntax tree (ast)', () => {
      expect(parse('string', {})).to.be.an('array')
    })

    describe('str', () => {
      it('is a string', () => {
        expect(() => parse('string', {})).to.not.throw()
        expect(() => parse(8, {})).to.throw()
        expect(() => parse({object:''}, {})).to.throw()
        expect(() => parse(['array'], {})).to.throw()
      })
      it('may be null or undefined', () => {
        expect(() => parse(null, {})).to.not.throw()
        expect(() => parse(undefined, {})).to.not.throw()
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
        it('has `name`, `text` and `ast` fields', () => {
          var test = '{test}'
          var result = parse(test)
          expect(result).to.be.an('array')
          expect(result.length).to.eq(1)
          expect(result[0]).to.have.a.property('name')
          expect(result[0]).to.have.a.property('text')
          expect(result[0]).to.have.a.property('ast')
        })
        it('contains the full ast of any nested content', () => {
          var test = '{test with {nested {content}}}'
          var result = parse(test)
          expect(result).to.be.an('array')
          expect(result.length).to.equal(1)
          expect(result[0]).to.be.an('object')
          expect(result[0]).to.have.a.property('ast')
          expect(result[0].ast).to.be.an('array')
          expect(result[0].ast.length).to.equal(2)
          expect(result[0].ast[1]).to.be.an('object')
          expect(result[0].ast[1]).to.have.a.property('ast')
          expect(result[0].ast[1].ast).to.be.an('array')
          expect(result[0].ast[1].ast.length).to.equal(1)
          expect(result[0].ast[1].ast[0]).to.be.an('object')
          expect(result[0].ast[1].ast[0]).to.have.a.property('ast')
          expect(result[0].ast[1].ast[0].ast).to.be.an('array')
          expect(result[0].ast[1].ast[0].ast.length).to.equal(0)
        })
      })
    })
  })

  describe('compile(ast, tags, [parent]) => template', () => {
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
      })
      it('is required', () => {
        expect(() => compile(null,{})).to.throw()
      })
    })

    describe('tags', () => {
      it('is an object', () => {
        expect(() => compile([], {})).to.not.throw()
        expect(() => compile([], 'hi')).to.throw()
        expect(() => compile([], 8)).to.throw()
      })
      it('is required', () => {
        expect(() => compile([])).to.throw()
        expect(() => compile([], null)).to.throw()
      })
    })

    describe('parent', () => {
      it('is an object', () => {
        expect(() => compile([], {}, {name:'test', tag:()=>{}, text:'{test}', children:[]})).to.not.throw()
      })
      it('is optional', () => {
        expect(() => compile([],{})).to.not.throw()
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
    it('this is a {test}: {hello, {world}!}', () => {
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
  })
})
