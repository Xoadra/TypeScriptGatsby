



const onCreateNode = require('./node-creation')
const setFieldsOnGraphQLNode = require('./graphql-fields')
const fuseResolvedNode = require('./execute-resolve')

const createNodeId = require('../create-node-id')
const createContentDigest = require('../content-digest')



module.exports = async (rawNode, pluginOptions = {}) => {
	pluginOptions = {
		blocks: pluginOptions.blocks,
		commonmark: true,
		footnotes: true,
		gfm: true,
		pedantic: true,
		...pluginOptions,
		tableOfContents: {
			heading: null,
			maxDepth: 6,
			...pluginOptions.tableOfContents
		}
	}
	const node = {
		id: createNodeId('oid', rawNode.data.data.repository.object.oid),
		children: [],
		parent: null,
		internal: {
			content: rawNode.data.data.repository.object.text,
			type: 'MarkdownRemark',
			mediaType: 'text/markdown',
			contentDigest: createContentDigest(rawNode.data)
		}
	}
	const helperApis = {
		node,
		createNodeId: id => createNodeId('oid', id),
		createContentDigest
	}
	const markdown = onCreateNode(helperApis, pluginOptions)
	const type = { name: node.internal.type, nodes: [markdown] }
	const fieldset = await setFieldsOnGraphQLNode({ type }, pluginOptions)
	const resolution = await fuseResolvedNode(markdown, fieldset)
	return { ...rawNode.data.data, markdownRemark: resolution }
}


