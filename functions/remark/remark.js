



const Remark = require('gatsby-transformer-remark/gatsby-node')
const reporter = require('gatsby-cli/lib/reporter')
const createNodeId = require('gatsby/dist/utils/create-node-id')
const getCache = require('gatsby/dist/utils/get-cache')
const { getNode, getNodesByType } = require('gatsby/dist/db/nodes')
const { actions } = require('gatsby/dist/redux/actions')
const { createContentDigest } = require('gatsby/utils')



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
		plugins: []
	}
	const nodeHelpers = {
		node,
		loadNodeContent: node => node.internal.content,
		actions,
		createNodeId: id => createNodeId('oid', id),
		reporter,
		createContentDigest
	}
	Remark.createSchemaCustomization(nodeHelpers, defaultOptions)
	Remark.onCreateNode(nodeHelpers, defaultOptions).then(markdown => {
		const fieldHelpers = {
			type: { name: node.internal.type, nodes: [markdown] },
			//basePath,
			getNode,
			getNodesByType,
			cache: getCache('gatsby-transformer-remark'),
			getCache,
			reporter
		}
		Remark.setFieldsOnGraphQLNodeType(fieldHelpers, defaultOptions).then(fields => {
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



