



const _ = require('lodash')
const Promise = require('bluebird')
const Remark = require('remark')
const parse = require('remark-parse')
const english = require('retext-english')
const remark2retext = require('remark-retext')
const stringify = require('remark-stringify')
const sanitizeHTML = require('sanitize-html')
const select = require('unist-util-select')
const visit = require('unist-util-visit')
const stripPosition = require('unist-util-remove-position')
const hastReparseRaw = require('hast-util-raw')
const hastToHTML = require('hast-util-to-html')
const toHAST = require('mdast-util-to-hast')
const mdastToToc = require('mdast-util-toc')
const mdastToString = require('mdast-util-to-string')
const prune = require('underscore.string/prune')
const unified = require('unified')

const { getConcatenatedValue, cloneTreeUntil, findLastTextNode } = require('./hast-processing')
const codeHandler = require('./code-handler')



//let fileNodes
//let pluginsCacheStr = ''
//let pathPrefixCacheStr = ''

//const ASTPromiseMap = new Map()

const SpaceMarkdownNodeTypesSet = new Set([
	'paragraph',
	'heading',
	'tableCell',
	'break'
])

const headingLevels = [...Array(6).keys()].reduce((acc, i) => {
	acc[`h${i}`] = i
	return acc
}, {})


/* const astCacheKey = node => (
	`transformer-remark-markdown-ast-${node.internal.contentDigest}-${pluginsCacheStr}-${pathPrefixCacheStr}`
) */


/* const htmlCacheKey = node => (
	`transformer-remark-markdown-html-${node.internal.contentDigest}-${pluginsCacheStr}-${pathPrefixCacheStr}`
) */


/* const htmlAstCacheKey = node => (
	`transformer-remark-markdown-html-ast-${node.internal.contentDigest}-${pluginsCacheStr}-${pathPrefixCacheStr}`
) */


/* const headingsCacheKey = node => (
	`transformer-remark-markdown-headings-${node.internal.contentDigest}-${pluginsCacheStr}-${pathPrefixCacheStr}`
) */


/* const tableOfContentsCacheKey = (node, appliedTocOptions) => (
	`transformer-remark-markdown-toc-${node.internal.contentDigest}-${pluginsCacheStr}-${JSON.stringify(
		appliedTocOptions
	)}-${pathPrefixCacheStr}`
) */


const withPathPrefix = (url, pathPrefix) => (
	(pathPrefix + url).replace(/\/\//, '/')
)


/* const safeGetCache = ({ getCache, cache }) => id => {
	if (!getCache) {
		return cache
	}
	return getCache(id)
} */


module.exports = (
	{
		type,
		basePath,
		//getNode,
		//getNodesByType,
		//cache,
		//getCache: possibleGetCache,
		//reporter,
		//...rest
	},
	pluginOptions
) => {
	if (type.name !== 'MarkdownRemark') {
		return {}
	}
	pluginsCacheStr = pluginOptions.plugins.map(p => p.name).join('')
	pathPrefixCacheStr = basePath || ''
	//const getCache = safeGetCache({ cache, getCache: possibleGetCache })
	return new Promise((resolve, reject) => {
		const {
			blocks,
			commonmark = true,
			footnotes = true,
			gfm = true,
			pedantic = true,
			tableOfContents = {
				heading: null,
				maxDepth: 6
			}
		} = pluginOptions
		const tocOptions = tableOfContents
		const remarkOptions = {
			commonmark,
			footnotes,
			gfm,
			pedantic
		}
		if (_.isArray(blocks)) {
			remarkOptions.blocks = blocks
		}
		let remark = new Remark().data('settings', remarkOptions)
		/* for (let plugin of pluginOptions.plugins) {
			const requiredPlugin = require(plugin.resolve)
			if (_.isFunction(requiredPlugin.setParserPlugins)) {
				for (let parserPlugin of requiredPlugin.setParserPlugins(plugin.pluginOptions)) {
					if (_.isArray(parserPlugin)) {
						const [parser, options] = parserPlugin
						remark = remark.use(parser, options)
					} else {
						remark = remark.use(parserPlugin)
					}
				}
			}
		} */
		const getAST = async markdownNode => {
			/* const cacheKey = astCacheKey(markdownNode)
			const cachedAST = await cache.get(cacheKey)
			if (cachedAST) {
				return cachedAST
			} else if (ASTPromiseMap.has(cacheKey)) {
				return await ASTPromiseMap.get(cacheKey)
			} else {
				
			} */
			const ASTGenerationPromise = getMarkdownAST(markdownNode)
			ASTGenerationPromise.then(markdownAST => markdownAST).catch(err => err)
			/* ASTGenerationPromise.then(markdownAST => {
				ASTPromiseMap.delete(cacheKey)
				return cache.set(cacheKey, markdownAST)
			}).catch(err => {
				ASTPromiseMap.delete(cacheKey)
				return err
			})
			ASTPromiseMap.set(cacheKey, ASTGenerationPromise) */
			return ASTGenerationPromise
		}
		const getMarkdownAST = async markdownNode => {
			/* if (process.env.NODE_ENV !== 'production' || !fileNodes) {
				fileNodes = getNodesByType('File')
			} */
			/* await Promise.each(pluginOptions.plugins, plugin => {
				const requiredPlugin = require(plugin.resolve)
				if (_.isFunction(requiredPlugin.mutateSource)) {
					return requiredPlugin.mutateSource(
						{
							markdownNode,
							//files: fileNodes,
							//getNode,
							//reporter,
							//cache: getCache(plugin.name),
							//getCache,
							compiler: {
								parseString: remark.parse.bind(remark),
								generateHTML: getHTML
							},
							...rest
						},
						plugin.pluginOptions
					)
				} else {
					return Promise.resolve()
				}
			}) */
			const markdownAST = remark.parse(markdownNode.internal.content)
			if (basePath) {
				visit(markdownAST, ['link', 'definition'], node => {
					if (
						node.url &&
						node.url.startsWith('/') &&
						!node.url.startsWith('//')
					) {
						node.url = withPathPrefix(node.url, basePath)
					}
				})
			}
			/* if (process.env.NODE_ENV !== 'production' || !fileNodes) {
				fileNodes = getNodesByType('File')
			} */
			/* await Promise.each(pluginOptions.plugins, plugin => {
				const requiredPlugin = require(plugin.resolve)
				if (_.isFunction(requiredPlugin)) {
					return requiredPlugin(
						{
							markdownAST,
							markdownNode,
							//getNode,
							//files: fileNodes,
							basePath,
							//reporter,
							//cache: getCache(plugin.name),
							//getCache,
							compiler: {
								parseString: remark.parse.bind(remark),
								generateHTML: getHTML
							},
							...rest
						},
						plugin.pluginOptions
					)
				} else {
					return Promise.resolve()
				}
			}) */
			return markdownAST
		}
		const getHeadings = async markdownNode => {
			/* const cachedHeadings = await cache.get(headingsCacheKey(markdownNode))
			if (cachedHeadings) {
				return cachedHeadings
			} else {
				
			} */
			const ast = await getAST(markdownNode)
			const headings = select.selectAll('heading', ast).map(heading => {
				return {
					value: mdastToString(heading),
					depth: heading.depth
				}
			})
			//cache.set(headingsCacheKey(markdownNode), headings)
			return headings
		}
		const getTableOfContents = async (markdownNode, gqlTocOptions) => {
			let appliedTocOptions = { ...tocOptions, ...gqlTocOptions }
			/* const cachedToc = await cache.get(
				tableOfContentsCacheKey(markdownNode, appliedTocOptions)
			)
			if (cachedToc) {
				return cachedToc
			} else {
				
			} */
			const ast = await getAST(markdownNode)
			const tocAst = mdastToToc(ast, appliedTocOptions)
			let toc
			if (tocAst.map) {
				const addSlugToUrl = node => {
					if (node.url) {
						if (
							_.get(markdownNode, appliedTocOptions.pathToSlugField) === undefined
						) {
							console.warn(
								`Skipping TableOfContents. Field '${appliedTocOptions.pathToSlugField}' missing from markdown node`
							)
							return null
						}
						node.url = [
							basePath,
							_.get(markdownNode, appliedTocOptions.pathToSlugField),
							node.url
						].join('/').replace(/\/\//g, '/')
					}
					if (node.children) {
						node.children = node.children.map(node => addSlugToUrl(node)).filter(Boolean)
					}
					return node
				}
				if (appliedTocOptions.absolute) {
					tocAst.map = addSlugToUrl(tocAst.map)
				}
				toc = hastToHTML(toHAST(tocAst.map))
			} else {
				toc = ''
			}
			//cache.set(tableOfContentsCacheKey(markdownNode, appliedTocOptions), toc)
			return toc
		}
		const getHTMLAst = async markdownNode => {
			/* const cachedAst = await cache.get(htmlAstCacheKey(markdownNode))
			if (cachedAst) {
				return cachedAst
			} else {
				
			} */
			const ast = await getAST(markdownNode)
			const htmlAst = toHAST(ast, {
				allowDangerousHTML: true,
				handlers: { code: codeHandler }
			})
			//cache.set(htmlAstCacheKey(markdownNode), htmlAst)
			return htmlAst
		}
		const getHTML = async markdownNode => {
			/* const shouldCache = markdownNode && markdownNode.internal
			const cachedHTML = shouldCache && (await cache.get(htmlCacheKey(markdownNode)))
			if (cachedHTML) {
				return cachedHTML
			} else {
				
			} */
			const ast = await getHTMLAst(markdownNode)
			const html = hastToHTML(ast, {
				allowDangerousHTML: true
			})
			/* if (shouldCache) {
				cache.set(htmlCacheKey(markdownNode), html)
			} */
			return html
		}
		const getExcerptAst = async (
			fullAST,
			markdownNode,
			{ pruneLength, truncate, excerptSeparator }
		) => {
			if (excerptSeparator && markdownNode.excerpt !== '') {
				return cloneTreeUntil(
					fullAST,
					({ nextNode }) => (
						nextNode.type === 'raw' && nextNode.value === excerptSeparator
					)
				)
			}
			if (!fullAST.children.length) {
				return fullAST
			}
			const excerptAST = cloneTreeUntil(fullAST, ({ root }) => {
				const totalExcerptSoFar = getConcatenatedValue(root)
				return totalExcerptSoFar && totalExcerptSoFar.length > pruneLength
			})
			const unprunedExcerpt = getConcatenatedValue(excerptAST)
			if (
				!unprunedExcerpt ||
				(pruneLength && unprunedExcerpt.length < pruneLength)
			) {
				return excerptAST
			}
			const lastTextNode = findLastTextNode(excerptAST)
			const amountToPruneBy = unprunedExcerpt.length - pruneLength
			const desiredLengthOfLastNode =
				lastTextNode.value.length - amountToPruneBy
			if (!truncate) {
				lastTextNode.value = prune(
					lastTextNode.value,
					desiredLengthOfLastNode,
					'…'
				)
			} else {
				lastTextNode.value = _.truncate(lastTextNode.value, {
					length: pruneLength,
					omission: '…'
				})
			}
			return excerptAST
		}
		const getExcerptHtml = async (markdownNode, pruneLength, truncate, excerptSeparator) => {
			const fullAST = await getHTMLAst(markdownNode)
			const excerptAST = await getExcerptAst(fullAST, markdownNode, {
				pruneLength,
				truncate,
				excerptSeparator
			})
			const html = hastToHTML(excerptAST, {
				allowDangerousHTML: true
			})
			return html
		}
		const getExcerptMarkdown = async (markdownNode, pruneLength, truncate, excerptSeparator) => {
			if (excerptSeparator && markdownNode.excerpt !== '') {
				return markdownNode.excerpt
			}
			const ast = await getMarkdownAST(markdownNode)
			const excerptAST = await getExcerptAst(ast, markdownNode, {
				pruneLength,
				truncate,
				excerptSeparator
			})
			let excerptMarkdown = unified().use(stringify).stringify(excerptAST)
			return excerptMarkdown
		}
		const getExcerptPlain = async (markdownNode, pruneLength, truncate, excerptSeparator) => {
			const text = await getAST(markdownNode).then(ast => {
				let excerptNodes = []
				let isBeforeSeparator = true
				visit(
					ast,
					node => isBeforeSeparator,
					node => {
						if (excerptSeparator && node.value === excerptSeparator) {
							isBeforeSeparator = false
						} else if (node.type === 'text' || node.type === 'inlineCode') {
							excerptNodes.push(node.value)
						} else if (node.type === 'image') {
							excerptNodes.push(node.alt)
						} else if (SpaceMarkdownNodeTypesSet.has(node.type)) {
							excerptNodes.push(' ')
						}
					}
				)
				const excerptText = excerptNodes.join('').trim()
				if (excerptSeparator && !isBeforeSeparator) {
					return excerptText
				}
				if (!truncate) {
					return prune(excerptText, pruneLength, '…')
				}
				return _.truncate(excerptText, {
					length: pruneLength,
					omission: '…'
				})
			})
			return text
		}
		const getExcerpt = async (
			markdownNode,
			{ format, pruneLength, truncate, excerptSeparator }
		) => {
			if (format === 'HTML') {
				return getExcerptHtml(
					markdownNode,
					pruneLength,
					truncate,
					excerptSeparator
				)
			} else if (format === 'MARKDOWN') {
				return getExcerptMarkdown(
					markdownNode,
					pruneLength,
					truncate,
					excerptSeparator
				)
			}
			return getExcerptPlain(
				markdownNode,
				pruneLength,
				truncate,
				excerptSeparator
			)
		}
		return resolve({
			html: {
				type: 'String',
				resolve: markdownNode => getHTML(markdownNode)
			},
			htmlAst: {
				type: 'JSON',
				resolve: markdownNode => (
					getHTMLAst(markdownNode).then(ast => {
						const strippedAst = stripPosition(_.clone(ast), true)
						return hastReparseRaw(strippedAst)
					})
				)
			},
			excerpt: {
				type: 'String',
				args: {
					pruneLength: {
						type: 'Int',
						defaultValue: 140
					},
					truncate: {
						type: 'Boolean',
						defaultValue: false
					},
					format: {
						type: 'MarkdownExcerptFormats',
						defaultValue: 'PLAIN'
					},
				},
				resolve: (markdownNode, { format, pruneLength, truncate }) => (
					getExcerpt(markdownNode, {
						format,
						pruneLength,
						truncate,
						excerptSeparator: pluginOptions.excerpt_separator
					})
				)
			},
			excerptAst: {
				type: 'JSON',
				args: {
					pruneLength: {
						type: 'Int',
						defaultValue: 140
					},
					truncate: {
						type: 'Boolean',
						defaultValue: false
					}
				},
				resolve: (markdownNode, { pruneLength, truncate }) => (
					getHTMLAst(markdownNode).then(fullAST => (
						getExcerptAst(fullAST, markdownNode, {
							pruneLength,
							truncate,
							excerptSeparator: pluginOptions.excerpt_separator
						})
					)).then(ast => {
						const strippedAst = stripPosition(_.clone(ast), true)
						return hastReparseRaw(strippedAst)
					})
				)
			},
			headings: {
				type: ['MarkdownHeading'],
				args: {
					depth: 'MarkdownHeadingLevels'
				},
				resolve: (markdownNode, { depth }) => (
					getHeadings(markdownNode).then(headings => {
						const level = depth && headingLevels[depth]
						if (typeof level === 'number') {
							headings = headings.filter(heading => heading.depth === level)
						}
						return headings
					})
				)
			},
			timeToRead: {
				type: 'Int',
				resolve: markdownNode => (
					getHTML(markdownNode).then(html => {
						let timeToRead = 0
						const pureText = sanitizeHTML(html, { allowTags: [] })
						const avgWPM = 265
						/* const wordCount =
							_.words(pureText).length +
							_.words(pureText, /[\p{sc=Katakana}\p{sc=Hiragana}\p{sc=Han}]/gu).length */
						const wordCount =
							_.words(pureText).length +
							_.words(pureText, /[\p{sc=Katakana}\p{sc=Hiragana}\p{sc=Han}]/g).length
						timeToRead = Math.round(wordCount / avgWPM)
						if (timeToRead === 0) {
							timeToRead = 1
						}
						return timeToRead
					})
				)
			},
			tableOfContents: {
				type: 'String',
				args: {
					absolute: {
						type: 'Boolean',
						//defaultValue: true,
						defaultValue: false
					},
					pathToSlugField: {
						type: 'String',
						//defaultValue: 'fields.slug',
						defaultValue: ''
					},
					maxDepth: 'Int',
					heading: 'String'
				},
				resolve: (markdownNode, args) => getTableOfContents(markdownNode, args)
			},
			wordCount: {
				type: 'MarkdownWordCount',
				resolve: markdownNode => {
					let counts = {}
					const count = () => (tree => (
						visit(tree, node => (
							counts[node.type] = (counts[node.type] || 0) + 1
						))
					))
					unified().use(parse).use(
						remark2retext,
						unified().use(english).use(count)
					).use(stringify).processSync(markdownNode.internal.content)
					return {
						paragraphs: counts.ParagraphNode,
						sentences: counts.SentenceNode,
						words: counts.WordNode
					}
				}
			}
		})
	})
}


