



const uuidv5 = require('uuid/v5')



module.exports = (id, namespace) => {
	const seedConstant = '638f7a53-c567-4eca-8fc1-b23efb1cfb2b'
	if (typeof id === 'number') {
		id = id.toString()
	} else if (typeof id !== 'string') {
		throw new Error(
			`Parameter passed to createNodeId must be a String or Number (got ${typeof id})`
		)
	}
	return uuidv5(id, uuidv5(namespace, seedConstant))
}


