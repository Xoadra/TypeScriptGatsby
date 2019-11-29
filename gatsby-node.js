



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
			contentDigest: edge.createContentDigest(request.data)
		}
	}
	edge.actions.createNode({ ...metadata, ...request.data })
}

exports.onCreateNode = edge => {
	const targets = ['MarkdownRemark', 'MarkdownRemote']
	if (targets.some(type => edge.node.internal.type === type)) {
		console.log(edge.node)
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


