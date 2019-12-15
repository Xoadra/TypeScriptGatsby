



const createSchema = require('../src/helpers/create-schema')
const createNodeId = require('../src/helpers/create-node-id')
const getCache = require('../src/helpers/get-cache')
const { getNode, getNodesByType } = require('../src/helpers/nodes')
const { actions } = require('../src/helpers/actions')
const { createContentDigest } = require('../src/helpers/content-digest')



exports.handler = (event, context, callback) => {
	const graphql = JSON.parse(event.body)
	callback(null, {
		statusCode: 200,
		body: JSON.stringify(graphql)
	})
}



