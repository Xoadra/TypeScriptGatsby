



const crypto = require('crypto')
const objectHash = require('node-object-hash')



const hasher = objectHash({
	coerce: false,
	alg: 'md5',
	enc: 'hex',
	sort: {
		map: true,
		object: true,
		array: false,
		set: false
	}
})


const hashPrimitive = input => (
	crypto.createHash('md5').update(input).digest('hex')
)


module.exports = input => {
	if (typeof input === 'object') {
		return hasher.hash(input)
	}
	return hashPrimitive(input)
}


