require('anylogger-debug')
var log = require('anylogger')('kurly:spec')
var expect = require('chai').expect
var sinon = require('sinon')
// var sandbox = sinon.createSandbox()
var kurly = require('./')
var { parse, compile } = kurly

describe('API', () => {
  describe('kurly', () => {
    it('is an object', () => {
      expect(kurly).to.be.an('object')
    })
    
    describe('parse(str, tags)', () => {
      it('is a function', () => {
        expect(parse).to.be.a('function')
      })
      it('accepts 1 argument', () => {
        expect(parse).property('length').to.equal(1)
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
      it('returns an array', () => {
        expect(parse('string', {})).to.be.an('array')
      })
    })
    
    describe('compile(ast, tags, [parent])', () => {
      it('is a function', () => {
        expect(compile).to.be.a('function')
      })
      it('accepts 3 argument', () => {
        expect(compile).property('length').to.equal(3)
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
          expect(() => compile([], null)).to.throw()
        })
      })
      describe('parent', () => {
        it('is an object', () => {
          expect(() => compile([], {name:'test', tag:()=>{}, text:'{test}', children:[]})).to.not.throw()
        })
        it('is optional', () => {
          expect(() => compile([],{})).to.not.throw()
        })
      })
      it('returns a function', () => {
        expect(compile([],{})).to.be.a('function')
      })
    })
  })
  describe('Parsing', () => {
    it('creates an array of nodes, each of which are either strings or objects', () => {
      var test = 'this is a {test}'
      var tags = {
        
        test: function({name, text, ast}){
          log('test', name, text, ast)
          return function(rec) {
            log('test', '{' + name + '}', rec)
            return ['Hello, '].concat(children).join('')
          }
        }
      }
      var result = parse(test, tags)
      log('Parsing', test, '=>', result)
      expect(result).to.be.an('array')
      expect(result.length).to.eq(2)
      expect(result[0]).to.eq('this is a ')
      expect(result[1]).to.be.an('object')

    })
    it('transforms tags to text', () => {
      var test = 'test'
      var tags = {}
      var result = parse(test, tags)
      var expected = ['test']
      expect(result).to.deep.equal(expected)
    })
  })
  describe('Compiling', () => {
    it('creates a function', () => {
      var test = 'this is a {test}: {hello, {world}!}'
      var expected = ['this is a ', 'TEST', ': ', 'Hello', ', ', 'Earth', '!']
      var tags = {
        test: () => r => 'TEST',
        hello: () => (r,children) => ['Hello'].concat(children),
        world: () => ({planet='World'}) => planet,
      }
      var parsed = parse(test)
      var compiled = compile(parsed, tags)
      expect(compiled).to.be.a('function')
      var result = compiled({planet: 'Earth'})
      console.info('result', result)
      expect(result).to.deep.equal(expected)
    })
  })
})
