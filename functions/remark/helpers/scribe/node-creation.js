



const _ = require('lodash')
const grayMatter = require('gray-matter')



module.exports = ({ node, createNodeId, createContentDigest }, pluginOptions) => {
	if (node.internal.mediaType === 'text/markdown' || node.internal.mediaType === 'text/x-markdown') {
		try {
			let data = grayMatter(node.internal.content, pluginOptions)
			if (data.data) {
				// Will want to update this to not require lodash
				data.data = _.mapValues(data.data, value => {
					if (_.isDate(value)) {
						return value.toJSON()
					}
					return value
				})
			}
			let markdownNode = {
				id: createNodeId(`${node.id} >>> MarkdownRemark`),
				children: [],
				parent: node.id,
				internal: {
					content: data.content,
					type: 'MarkdownRemark',
					contentDigest: createContentDigest(node)
				},
				frontmatter: {
					title: '',
					...data.data
				},
				excerpt: data.excerpt,
				rawMarkdownBody: data.content,
				fileAbsolutePath: node.internal.type === 'File' && node.absolutePath ? node.absolutePath : ''
			}
			return markdownNode
		} catch (error) {
			throw new Error(`
				Error processing Markdown ${
					node.absolutePath ? `file ${node.absolutePath}` : `in node ${node.id}`
				}:\n${error.message}
			`)
			//return {}
		}
	}
	return {}
}


