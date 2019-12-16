



const _ = require('lodash')
const { default: sift } = require('sift')
const { makeRe } = require('micromatch')

const { prepareRegex, getValueAt } = require('./utils')
const { toDottedFields, objectToDottedField, liftResolvedFields } = require('./query')



const prepareQueryArgs = (filterFields = {}) => (
	Object.keys(filterFields).reduce((acc, key) => {
		const value = filterFields[key]
		if (_.isPlainObject(value)) {
			acc[key === 'elemMatch' ? '$elemMatch' : key] = prepareQueryArgs(value)
		} else {
			switch (key) {
				case 'regex':
					acc['$regex'] = prepareRegex(value)
					break
				case 'glob':
					acc['$regex'] = makeRe(value)
					break
				default:
					acc[`$${key}`] = value
			}
		}
		return acc
	}, {})
)


const getFilters = filters => (
	Object.keys(filters).reduce(
		(acc, key) => acc.push({ [key]: filters[key] }) && acc, []
	)
)


const isEqId = (firstOnly, siftArgs) => {
	return (
		firstOnly &&
		siftArgs.length > 0 &&
		siftArgs[0].id &&
		Object.keys(siftArgs[0].id).length === 1 &&
		Object.keys(siftArgs[0].id)[0] === '$eq'
	)
}


const handleFirst = (siftArgs, nodes) => {
	const index = _.isEmpty(siftArgs) ? 0 : nodes.findIndex(sift({ $and: siftArgs }))
	if (index !== -1) {
		return [nodes[index]]
	} else {
		return []
	}
}


const handleMany = (siftArgs, nodes, sort, resolvedFields) => {
	let result = _.isEmpty(siftArgs) ? nodes : nodes.filter(sift({ $and: siftArgs }))
	if (!result || !result.length) return null
	if (sort) {
		const dottedFields = objectToDottedField(resolvedFields)
		const dottedFieldKeys = Object.keys(dottedFields)
		const sortFields = sort.fields.map(field => {
			if (
				dottedFields[field] || dottedFieldKeys.some(key => field.startsWith(key))
			) {
				return `__gatsby_resolved.${field}`
			} else {
				return field
			}
		}).map(field => v => getValueAt(v, field))
		const sortOrder = sort.order.map(order => order.toLowerCase())
		result = _.orderBy(result, sortFields, sortOrder)
	}
	return result
}


const runSift = args => {
	const { getNode, getNodesAndResolvedNodes } = require('./nodes')
	const { nodeTypeNames } = args
	let nodes
	if (nodeTypeNames.length > 1) {
		nodes = nodeTypeNames.reduce((acc, typeName) => {
			acc.push(...getNodesAndResolvedNodes(typeName))
			return acc
		}, [])
	} else {
		nodes = getNodesAndResolvedNodes(nodeTypeNames[0])
	}
	return runSiftOnNodes(nodes, args, getNode)
}


const runSiftOnNodes = (nodes, args, getNode) => {
	const {
		queryArgs = { filter: {}, sort: {} },
		firstOnly = false,
		resolvedFields = {},
		nodeTypeNames
	} = args
	let siftFilter = getFilters(
		liftResolvedFields(
			toDottedFields(prepareQueryArgs(queryArgs.filter)), resolvedFields
		)
	)
	if (isEqId(firstOnly, siftFilter)) {
		const node = getNode(siftFilter[0].id['$eq'])
		if (
			!node || (node.internal && !nodeTypeNames.includes(node.internal.type))
		) {
			return []
		}
		return [node]
	}
	if (firstOnly) {
		return handleFirst(siftFilter, nodes)
	} else {
		return handleMany(siftFilter, nodes, queryArgs.sort, resolvedFields)
	}
}


module.exports = { runSift, runSiftOnNodes }


