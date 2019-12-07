const assert = require('assert')
const parse = require('../parser')

function test (input) {
  assert.deepStrictEqual(parse(input), JSON.parse(input))
}

describe('Base test', () => {
  it('element', () => {
    test('{}')
  })

  it('object', () => {
    test('{ "foo": "baz" }')
  })

  it('array', () => {
    test('["foo", "baz"]')
  })

  it('number', () => {
    test('{ "num": 10 }')
    test('{ "num": 10.1 }')
    test('{ "num": -10 }')
    test('{ "num": 10e1 }')
    test('{ "num": -325.45e6 }')
    test('{ "num": -0 }')
    test('{ "num": 10E3 }')
    test('{ "num": 10e+3 }')
    test('{ "num": 10e-3 }')
  })

  it('bool', () => {
    test('{ "bool": true }')
    test('{ "bool": false }')
    test('[true, false]')
  })

  it('null', () => {
    test('{ "key": null }')
    test('[null]')
  })

  it('nest', () => {
    test('{ "a": {} }')
    test('{ "b": [] }')
    test('{ "c": { "d": [] } }')
    test('[{ "a": "b" }, ["a", 1, 2]]')
    test('{ "arr": [true, null, { "num": -325.45e6, "str": "str" }], "null": null, "bool": true }')
  })
})