



const { isEqual } = require('lodash')

const { looksLikeADate } = require('../toolkit/date-type')



const getType = (value, key) => {
	const is32BitInteger = num => (num | 0) === num
	switch (typeof value) {
		case 'number':
			return is32BitInteger(value) ? 'int' : 'float'
		case 'string':
			if (key.includes('___NODE')) {
				return 'relatedNode'
			}
			return looksLikeADate(value) ? 'date' : 'string'
		case 'boolean':
			return 'boolean'
		case 'object':
			if (value === null) return 'null'
			if (value instanceof Date) return 'date'
			if (value instanceof String) return 'string'
			if (Array.isArray(value)) {
				if (value.length === 0) {
					return 'null'
				}
				return key.includes('___NODE') ? 'relatedNodeList' : 'array'
			}
			if (!Object.keys(value).length) return 'null'
			return 'object'
		default:
			return 'null'
	}
}


const updateValueDescriptorObject = (value, typeInfo, nodeId, operation, metadata, path) => {
	path.push(value)
	const { dprops = {} } = typeInfo
	typeInfo.dprops = dprops
	Object.keys(value).forEach(key => {
		const v = value[key]
		let descriptor = dprops[key]
		if (descriptor === undefined) {
			descriptor = {}
			dprops[key] = descriptor
		}
		updateValueDescriptor(nodeId, key, v, operation, descriptor, metadata, path)
	})
	path.pop()
}


const updateValueDescriptorArray = (value, key, typeInfo, nodeId, operation, metadata, path) => {
	value.forEach(item => {
		let descriptor = typeInfo.item
		if (descriptor === undefined) {
			descriptor = {}
			typeInfo.item = descriptor
		}
		updateValueDescriptor(
			nodeId,
			key,
			item,
			operation,
			descriptor,
			metadata,
			path
		)
	})
}


const updateValueDescriptorRelNodes = (listOfNodeIds, delta, operation, typeInfo, metadata) => {
	const { nodes = {} } = typeInfo
	typeInfo.nodes = nodes
	listOfNodeIds.forEach(nodeId => {
		nodes[nodeId] = (nodes[nodeId] || 0) + delta
		if (nodes[nodeId] === 0 || (operation === 'add' && nodes[nodeId] === 1)) {
			metadata.dirty = true
		}
	})
}


const updateValueDescriptorString = (value, delta, typeInfo) => {
	if (value === '') {
		const { empty = 0 } = typeInfo
		typeInfo.empty = empty + delta
	}
	typeInfo.example =
		typeof typeInfo.example !== 'undefined' ? typeInfo.example : value
}


const updateValueDescriptor = (nodeId, key, value, operation = 'add', descriptor, metadata, path) => {
	if (path.includes(value)) {
		return
	}
	const typeName = getType(value, key)
	if (typeName === 'null') {
		return
	}
	const delta = operation === 'del' ? -1 : 1
	let typeInfo = descriptor[typeName]
	if (typeInfo === undefined) {
		typeInfo = descriptor[typeName] = { total: 0 }
	}
	typeInfo.total += delta
	if (typeInfo.total === 0 || (operation === 'add' && typeInfo.total === 1)) {
		metadata.dirty = true
	}
	if (operation === 'add') {
		if (!typeInfo.first) {
			typeInfo.first = nodeId
		}
	} else if (operation === 'del') {
		if (typeInfo.first === nodeId || typeInfo.total === 0) {
			typeInfo.first = undefined
		}
	}
	switch (typeName) {
		case 'object':
			updateValueDescriptorObject(
				value,
				typeInfo,
				nodeId,
				operation,
				metadata,
				path
			)
			return
		case 'array':
			updateValueDescriptorArray(
				value,
				key,
				typeInfo,
				nodeId,
				operation,
				metadata,
				path
			)
			return
		case 'relatedNode':
			updateValueDescriptorRelNodes(
				[value],
				delta,
				operation,
				typeInfo,
				metadata
			)
			return
		case 'relatedNodeList':
			updateValueDescriptorRelNodes(value, delta, operation, typeInfo, metadata)
			return
		case 'string':
			updateValueDescriptorString(value, delta, typeInfo)
			return
	}
	typeInfo.example =
		typeof typeInfo.example !== 'undefined' ? typeInfo.example : value
}


const mergeObjectKeys = (dpropsKeysA, dpropsKeysB) => {
	const dprops = Object.keys(dpropsKeysA)
	const otherProps = Object.keys(dpropsKeysB)
	return [...new Set(dprops.concat(otherProps))]
}


const descriptorsAreEqual = (descriptor, otherDescriptor) => {
	const types = possibleTypes(descriptor)
	const otherTypes = possibleTypes(otherDescriptor)
	if (types.length === 0 && otherTypes.length === 0) {
		return true
	}
	if (types.length > 1 || otherTypes.length > 1 || types[0] !== otherTypes[0]) {
		return false
	}
	switch (types[0]) {
		case 'array':
			return descriptorsAreEqual(
				descriptor.array.item,
				otherDescriptor.array.item
			)
		case 'object': {
			const dpropsKeys = mergeObjectKeys(
				descriptor.object.dprops,
				otherDescriptor.object.dprops
			)
			return dpropsKeys.every(prop =>
				descriptorsAreEqual(
				descriptor.object.dprops[prop],
				otherDescriptor.object.dprops[prop]
				)
			)
		}
		case 'relatedNode':
		case 'relatedNodeList': {
			return isEqual(descriptor.nodes, otherDescriptor.nodes)
		}
		default:
			return true
	}
}


const nodeFields = (node, ignoredFields = new Set()) => (
	Object.keys(node).filter(key => !ignoredFields.has(key))
)


const updateTypeMetadata = (metadata = initialMetadata(), operation, node) => {
	if (metadata.disabled) {
		return metadata
	}
	metadata.total = (metadata.total || 0) + (operation === 'add' ? 1 : -1)
	if (metadata.ignored) {
		return metadata
	}
	const { ignoredFields, fieldMap = {} } = metadata
	nodeFields(node, ignoredFields).forEach(field => {
		let descriptor = fieldMap[field]
		if (descriptor === undefined) {
			descriptor = {}
			fieldMap[field] = descriptor
		}
		updateValueDescriptor(
			node.id,
			field,
			node[field],
			operation,
			descriptor,
			metadata,
			[]
		)
	})
	metadata.fieldMap = fieldMap
	return metadata
}


const ignore = (metadata = initialMetadata(), set = true) => {
	metadata.ignored = set
	metadata.fieldMap = {}
	return metadata
}


const disable = (metadata = initialMetadata(), set = true) => {
	metadata.disabled = set
	return metadata
}


const addNode = (metadata, node) => updateTypeMetadata(metadata, 'add', node)


const deleteNode = (metadata, node) => updateTypeMetadata(metadata, 'del', node)


const addNodes = (metadata = initialMetadata(), nodes) => nodes.reduce(addNode, metadata)


const possibleTypes = (descriptor = {}) => (
	Object.keys(descriptor).filter(type => descriptor[type].total > 0)
)


const isEmpty = ({ fieldMap }) => (
	Object.keys(fieldMap).every(field => possibleTypes(fieldMap[field]).length === 0)
)


const hasNodes = typeMetadata => typeMetadata.total > 0


const haveEqualFields = ({ fieldMap = {} } = {}, { fieldMap: otherFieldMap = {} } = {}) => {
	const fields = mergeObjectKeys(fieldMap, otherFieldMap)
	return fields.every(field =>
		descriptorsAreEqual(fieldMap[field], otherFieldMap[field])
	)
}


const initialMetadata = state => {
	return {
		typeName: undefined,
		disabled: false,
		ignored: false,
		dirty: false,
		total: 0,
		ignoredFields: undefined,
		fieldMap: {},
		...state
	}
}


module.exports = {
	addNode,
	addNodes,
	deleteNode,
	ignore,
	disable,
	isEmpty,
	hasNodes,
	haveEqualFields,
	initialMetadata
}


