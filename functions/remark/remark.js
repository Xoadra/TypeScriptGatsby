



/* const createSchema = require('./helpers/scribe/create-schema') */
const onCreateNode = require('./helpers/scribe/node-creation')
const setFieldsOnGraphQLNode = require('./helpers/scribe/graphql-fields')

const createNodeId = require('./helpers/create-node-id')
/* const getCache = require('./helpers/get-cache') */
const createContentDigest = require('./helpers/content-digest')
/* const { getNode, getNodesByType, loadNodeContent } = require('./helpers/nodes') */
/* const { actions } = require('./helpers/actions') */



exports.handler = (event, context, callback) => {
	const graphql = JSON.parse(event.body)
	const node = {
		id: createNodeId('oid', graphql.data.data.repository.object.oid),
		children: [],
		parent: null,
		internal: {
			content: graphql.data.data.repository.object.text,
			type: 'MarkdownRemark',
			mediaType: 'text/markdown',
			contentDigest: createContentDigest(graphql.data)
		}
	}
	const defaultOptions = {
		commonmark: true,
		footnotes: true,
		gfm: true,
		pedantic: true,
		tableOfContents: {
			heading: null,
			maxDepth: 6
		},
		plugins: [
			'default-site-plugin'
		]
	}
	const nodeHelpers = {
		node,
		loadNodeContent: node => node.internal.content,
		//actions,
		createNodeId: id => createNodeId('oid', id),
		//reporter,
		createContentDigest
	}
	onCreateNode(nodeHelpers, defaultOptions).then(markdown => {
		const fieldHelpers = {
			type: { name: node.internal.type, nodes: [markdown] },
			//basePath,
			//getNode,
			//getNodesByType,
			//cache: getCache('gatsby-transformer-remark'),
			//getCache
			//reporter
		}
		setFieldsOnGraphQLNode(fieldHelpers, defaultOptions).then(fields => {
			const promises = Object.entries(fields).map(([key, value]) => {
				return new Promise((resolve, reject) => {
					const params = { ...Object.values(value.args || {}) }
					const field = value.resolve(markdown, params)
					const resolver = data => resolve({ [key]: data })
					field instanceof Promise ? field.then(resolver) : resolver(field)
				})
			})
			Promise.all(promises).then(resolved => {
				const content = resolved.reduce((node, value) => ({ ...node, ...value }), markdown)
				callback(null, {
					statusCode: 200,
					body: JSON.stringify(content)
				})
			})
		})
	})
}


