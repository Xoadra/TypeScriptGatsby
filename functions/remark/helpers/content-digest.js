



const crypto = require('crypto')
const objectHash = require('node-object-hash')



module.exports = input => {
	if (typeof input === 'object') {
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
		return hasher.hash(input)
	}
	const hashPrimitive = input => (
		crypto.createHash('md5').update(input).digest('hex')
	)
	return hashPrimitive(input)
}


