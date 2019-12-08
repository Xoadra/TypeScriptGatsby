



/**
 * Implement Gatsby's Node APIs in this file.
 * 
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

// You can delete this file if you're not using it


const TypeScriptCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const axios = require('axios')



exports.onPreInit = () => {
	require('dotenv').config()
}

exports.onCreateWebpackConfig = (edge, options) => {
	if (edge.stage === 'develop') {
		edge.actions.setWebpackConfig({
			plugins: [
				// Assign custom environment variables here
				edge.plugins.define({}),
				new TypeScriptCheckerWebpackPlugin({ ...options })
			]
		})
	}
}

exports.sourceNodes = async edge => {
	const url = 'https://api.github.com/graphql'
	const headers = { 'Authorization': `Bearer ${process.env.GITHUB_API_TOKEN}` }
	const query = {
		query: `query($owner: String!, $name: String!, $expression: String!) {
			repository(owner: $owner, name: $name) {
				object(expression: $expression) {
					... on Blob {
						oid
						text
					}
				}
			}
		}`,
		variables: {
			owner: 'junior-dev-struggle-bus',
			name: 'juniordevstrugglebus',
			expression: 'master:README.md'
		}
	}
	const graphql = await axios.post(url, query, { headers })
	const { text, oid } = graphql.data.data.repository.object
	const metadata = {
		id: edge.createNodeId(oid),
		children: [],
		parent: null,
		internal: {
			content: text,
			type: 'MarkdownRemote',
			mediaType: 'text/markdown',
			contentDigest: edge.createContentDigest(graphql.data)
		}
	}
	edge.actions.createNode({ ...metadata, ...graphql.data })
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

exports.onCreatePage = async edge => {
	if (edge.page.path.match(/^\/nexus/)) {
		edge.page.matchPath = '/within/*'
		edge.actions.createPage(edge.page)
	}
	if (edge.page.path.match(/^\/auth/)) {
		edge.page.matchPath = '/auth/*'
		edge.actions.createPage(edge.page)
	}
}


