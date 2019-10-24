const JSONParse = require('./parser')

const data = '{ "number": -325.45e6, "str": "Data", "Eces": [123, "b"] }'

console.log(JSONParse(data))
console.log(JSON.stringify(JSON.parse(data)) === JSON.stringify(JSONParse(data)))
