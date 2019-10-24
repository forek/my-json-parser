const GRAMMAR = [
  { token: 's', pattern: /".*?"/, value: (s) => s.match(/^"(.*)"$/)[1] },
  { token: 'n', pattern: /-?(0|([1-9][0-9]*))(\.\d*[1-9])?((e|E)(\+|\-)?\d+)?/, value: (n) => Number(n) },
  { token: 't', pattern: /true/, value: () => true },
  { token: 'f', pattern: /false/, value: () => false },
  { token: 'nil', pattern: /null/, value: () => null },
  { token: '{', pattern: /\{/ },
  { token: '}', pattern: /\}/ },
  { token: '[', pattern: /\[/ },
  { token: ']', pattern: /\]/ },
  { token: ',', pattern: /,/ },
  { token: ':', pattern: /:/ },
  { token: 'space', pattern: /\s/ }
]

function tokenize (str) {
  const token = []
  while (str.length) {
    let match = false
    for (let i = 0; i < GRAMMAR.length; i++) {
      const result = str.match(GRAMMAR[i].pattern)
      if (result && result.index === 0) {
        token.push({ type: GRAMMAR[i].token, value: GRAMMAR[i].value ? GRAMMAR[i].value(result[0]) : result[0] })
        str = str.slice(result[0].length)
        match = true
        break
      }
    }
    if (!match) throw new Error(`unexpected token: ${str}`)
  }
  return token.filter(item => item.type !== 'space')
}

function analyze (token) {
  const stack = ['$']
  stack.top = function () {
    return this[this.length - 1]
  }

  function createNode (type, parent) {
    return { type: type, child: [], parent: parent, scope: 'value' }
  }

  function getLastChild (needle) {
    return needle.child[needle.child.length - 1]
  }

  function unexpectedToken (curr) {
    return new Error(`unexpected token: ${curr.value}`)
  }

  let tree = {
    type: 'root',
    child: [],
    parent: null
  }

  let needle = tree

  while (token.length) {
    const curr = token.shift()

    // if (stack.top() === '$' && (curr !== '{' || curr !== '{' || token.length)) {
    //   throw new Error(`unexpected token: ${curr}`)
    // }

    switch (curr.type) {
      case '{': {
        const node = createNode('object', needle)
        needle.child.push(node)
        needle = node
        break
      }
      case '[': {
        const node = createNode('array', needle)
        needle.child.push(node)
        needle = node
        break
      }
      case '}': {
        const lastChild = getLastChild(needle)
        if (needle.type === 'object' &&
          (!lastChild || lastChild.scope === 'value')) {
          needle = needle.parent
        } else {
          throw unexpectedToken(curr)
        }
        break
      }
      case ']': {
        const lastChild = getLastChild(needle)
        if (needle.type === 'array' &&
          (!lastChild || lastChild.scope === 'value')) {
          needle = needle.parent
        } else {
          throw unexpectedToken(curr)
        }
        break
      }
      case 's': {
        const lastChild = getLastChild(needle)
        if (needle.type === 'object') {
          if (!lastChild || lastChild.type === ',') {
            needle.child.push({ type: curr.type, value: curr.value, scope: 'key' })
          } else if (lastChild && lastChild.type === ':') {
            needle.child.push({ type: curr.type, value: curr.value, scope: 'value' })
          } else {
            throw unexpectedToken(curr)
          }
        } else if (needle.type === 'array') {
          if (!lastChild || lastChild.type === ',') {
            needle.child.push({ type: curr.type, value: curr.value, scope: 'value' })
          } else {
            throw unexpectedToken(curr)
          }
        }
        break
      }
      case 'n':
      case 't':
      case 'f':
      case 'nil': {
        const lastChild = getLastChild(needle)

        if (
          (needle.type === 'object' && lastChild && lastChild.type === ':') ||
          (needle.type === 'array' && (!lastChild || lastChild.type === ','))
        ) {
          needle.child.push({ type: curr.type, value: curr.value, scope: 'value' })
        } else {
          throw unexpectedToken(curr)
        }

        break
      }
      case ',': {
        const lastChild = getLastChild(needle)
        if (lastChild && lastChild.scope === 'value') {
          needle.child.push({ type: curr.type, value: curr.value })
        } else {
          throw unexpectedToken(curr)
        }
        break
      }
      case ':': {
        const lastChild = getLastChild(needle)
        if (lastChild && lastChild.scope === 'key') {
          needle.child.push({ type: curr.type, value: curr.value })
        } else {
          throw unexpectedToken(curr)
        }
        break
      }
      default:
        throw unexpectedToken(curr)
    }
  }
  if (needle !== tree) throw unexpectedToken(token[0])
  return tree.child[0]
}

function join (node) {
  switch (node.type) {
    case 'object': {
      const result = {}
      let needle = null
      node.child.forEach(cnode => {
        if (cnode.scope === 'key') {
          result[cnode.value] = undefined
          if (needle) throw new Error('wrong')
          needle = cnode.value
        } else if (cnode.scope === 'value') {
          if (typeof result[needle] === 'undefined') {
            result[needle] = (cnode.type === 'array' || cnode.type === 'object') ? join(cnode) : cnode.value
            needle = null
          } else {
            throw new Error('wrong')
          }
        }
      })
      return result
    }
    case 'array': {
      const result = []
      node.child.forEach(cnode => {
        if (cnode.scope === 'value') result.push((cnode.type === 'array' || cnode.type === 'object') ? join(cnode) : cnode.value)
      })
      return result
    }
  }
}

module.exports = str => join(analyze(tokenize(str)))
