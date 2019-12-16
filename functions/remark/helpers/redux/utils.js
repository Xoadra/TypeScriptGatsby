



const _ = require('lodash')



const prepareRegex = str => {
	const exploded = str.split('/')
	const regex = new RegExp(
		exploded.slice(1, -1).join('/').replace(/\\\\/, '\\'),
		_.last(exploded)
	)
	return regex
}


const getValueAt = (obj, selector) => {
	const selectors = typeof selector === 'string' ? selector.split('.') : selector
	return get(obj, selectors)
}


const get = (obj, selectors) => {
	if (Array.isArray(obj)) return getArray(obj, selectors)
	const [key, ...rest] = selectors
	const value = obj[key]
	if (!rest.length) return value
	if (Array.isArray(value)) return getArray(value, rest)
	if (value && typeof value === 'object') return get(value, rest)
	return undefined
}


const getArray = (arr, selectors) => (
	arr.map(value => (
		Array.isArray(value) ? getArray(value, selectors) : get(value, selectors)
	)).filter(v => v !== undefined)
)


module.exports = { prepareRegex, getValueAt }


