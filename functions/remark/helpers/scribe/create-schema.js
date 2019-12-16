



const typeDefs = `
	type MarkdownHeading {
		value: String
		depth: Int
	}
	enum MarkdownHeadingLevels {
		h1
		h2
		h3
		h4
		h5
		h6
	}
	enum MarkdownExcerptFormats {
		PLAIN
		HTML
		MARKDOWN
	}
	type MarkdownWordCount {
		paragraphs: Int
		sentences: Int
		words: Int
	}
	type MarkdownRemark implements Node @infer @childOf(mimeTypes: ["text/markdown", "text/x-markdown"]) {
		id: ID!
	}
`


module.exports = (nodeApiArgs, pluginOptions = {}) => {
	const { plugins = [] } = pluginOptions
	nodeApiArgs.actions.createTypes(typeDefs)
	plugins.forEach(plugin => {
		const resolvedPlugin = require(plugin.resolve)
		if (typeof resolvedPlugin.createSchemaCustomization === 'function') {
			resolvedPlugin.createSchemaCustomization(
				nodeApiArgs,
				plugin.pluginOptions
			)
		}
	})
}


module.exports.typeDefs = typeDefs


