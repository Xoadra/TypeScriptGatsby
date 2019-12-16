



const { store } = require('./store')



function* resolvedNodesIterator(nodes, resolvedNodes) {
	for (const node of nodes.values()) {
		node.__gatsby_resolved = resolvedNodes.get(node.id)
		yield node
	}
}


const getNode = id => store.getState().nodes.get(id)


const getNodes = () => {
	const nodes = store.getState().nodes
	if (nodes) {
		return Array.from(nodes.values())
	} else {
		return []
	}
}


const getNodesByType = type => {
	const nodes = store.getState().nodesByType.get(type)
	if (nodes) {
		return Array.from(nodes.values())
	} else {
		return []
	}
}


const getTypes = () => Array.from(store.getState().nodesByType.keys())


const hasNodeChanged = (id, digest) => {
	const node = store.getState().nodes.get(id)
	if (!node) {
		return true
	} else {
		return node.internal.contentDigest !== digest
	}
}


const getNodeAndSavePathDependency = (id, path) => {
	/* const createPageDependency = require('./actions/add-page-dependency')
	const node = getNode(id)
	createPageDependency({ path, nodeId: id })
	return node */
	throw new Error('The getNodeAndSavePathDependency action helper has a missing dependency')
}


const saveResolvedNodes = async (nodeTypeNames, resolver) => {
	for (const typeName of nodeTypeNames) {
		const nodes = store.getState().nodesByType.get(typeName)
		const resolvedNodes = new Map()
		if (nodes) {
			for (const node of nodes.values()) {
				const resolved = await resolver(node)
				resolvedNodes.set(node.id, resolved)
			}
			store.dispatch({
				type: 'SET_RESOLVED_NODES',
				payload: {
					key: typeName,
					nodes: resolvedNodes
				}
			})
		}
	}
}


const getNodesAndResolvedNodes = typeName => {
	const { nodesByType, resolvedNodesCache } = store.getState()
	const nodes = nodesByType.get(typeName)
	if (nodes) {
		const resolvedNodes = resolvedNodesCache.get(typeName)
		if (resolvedNodes) {
			return Array.from(resolvedNodesIterator(nodes, resolvedNodes))
		} else {
			return Array.from(nodes.values())
		}
	} else {
		return []
	}
}


module.exports = {
	getNodes,
	getNode,
	getNodesByType,
	getTypes,
	hasNodeChanged,
	getNodeAndSavePathDependency,
	saveResolvedNodes,
	getNodesAndResolvedNodes
}



