



const _ = require('lodash')



const omitUndefined = data => {
	const isPlainObject = _.isPlainObject(data)
	if (isPlainObject) {
		return _.pickBy(data, p => p !== undefined)
	}
	return data.filter(p => p !== undefined)
}


const isTypeSupported = data => {
	if (data === null) {
		return true
	}
	const type = typeof data
	const isSupported =
		type === 'number' ||
		type === 'string' ||
		type === 'boolean' ||
		data instanceof Date
	return isSupported
}


module.exports = (data, isNode = true, path = new Set()) => {
	const isPlainObject = _.isPlainObject(data)
	if (isPlainObject || _.isArray(data)) {
		path.add(data)
		const returnData = isPlainObject ? {} : []
		let anyFieldChanged = false
		_.each(data, (o, key) => {
			if (path.has(o)) return
			if (isNode && key === 'internal') {
				returnData[key] = o
				return
			}
			returnData[key] = sanitizeNode(o, false, path)
			if (returnData[key] !== o) {
				anyFieldChanged = true
			}
		})
		if (anyFieldChanged) {
			data = omitUndefined(returnData)
		}
		path.add(data)
		return data
	}
	if (!isTypeSupported(data)) {
		return undefined
	} else {
		path.add(data)
		return data
	}
}


