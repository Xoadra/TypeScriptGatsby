



/**
 * Implement Gatsby's Node APIs in this file.
 * 
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

// You can delete this file if you're not using it


const TypeScriptCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const axios = require('axios')



exports.onCreateWebpackConfig = ({ stage, actions }, options) => {
	if (stage === 'develop') {
		actions.setWebpackConfig({
			plugins: [
				new TypeScriptCheckerWebpackPlugin({ ...options })
			]
		})
	}
}

exports.sourceNodes = async edge => {
	const user = 'junior-dev-struggle-bus'
	const source = 'juniordevstrugglebus/contents/README.md'
	const api = `https://api.github.com/repos/${user}/${source}`
	const headers = { 'Accept': 'application/vnd.github.v3+json' }
	const request = await axios.get(api, { headers })
	const markdown = Buffer.from(request.data.content, 'base64').toString('utf-8')
	const metadata = {
		id: edge.createNodeId(request.data.sha),
		children: [],
		parent: null,
		internal: {
			content: markdown,
			type: 'MarkdownRemote',
			mediaType: 'text/markdown',
			contentDigest: edge.createContentDigest(request.data)
		}
	}
	edge.actions.createNode({ ...metadata, ...request.data })
}

exports.onCreateNode = edge => {
	if (edge.node.internal.type === 'MarkdownRemark') {
		console.log('\n', edge.node, '\n')
		/* const params = {
			node: edge.node,
			getNode: edge.getNode,
			basePath: 'pages'
		}
		const slug = createFilePath(params);
		edge.actions.createNodeField({
			node: edge.node,
			name: 'slug',
			value: slug.slice(0, slug.length - 1)
		}) */
	}
}


