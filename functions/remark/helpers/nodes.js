



const _ = require('lodash')
/* const { store } = require('./redux/store') */



const backend = process.env.GATSBY_DB_NODES || 'redux'
let nodesDb
let runQuery
switch (backend) {
	case 'redux':
		nodesDb = require('./redux/nodes')
		runQuery = require('./redux/run-sift').runSift
		break
	/* case 'loki':
		nodesDb = require('./loki/nodes')
		runQuery = require('./loki/nodes-query')
		break */
	default:
		throw new Error(
			'Unsupported DB nodes backend (value of env var GATSBY_DB_NODES)'
		)
}


module.exports = { ...nodesDb, runQuery, backend, loadNodeContent: node => {
	return node.internal.content
	/* if (_.isString(node.internal.content)) {
		return Promise.resolve(node.internal.content)
	} else {
		return new Promise(resolve => {
			const plugin = store.getState().flattenedPlugins.find(plug => plug.name === node.internal.owner)
			const { loadNodeContent } = require(plugin.resolve)
			if (!loadNodeContent) {
				throw new Error(
					`Could not find function loadNodeContent for plugin ${plugin.name}`
				)
			}
			return loadNodeContent(node).then(content => {
				resolve(content)
			})
		})
	} */
}}


