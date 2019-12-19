



// getHeadings
const select = require('unist-util-select') 
const mdastToString = require('mdast-util-to-string')

// getTableOfContents
const _ = require('lodash')
const mdastToToc = require('mdast-util-toc')
const hastToHTML = require('hast-util-to-html')
const toHAST = require('mdast-util-to-hast')

// getHTMLAst
const toHAST = require('mdast-util-to-hast')
const codeHandler = require('./code-handler')

// getHTML
const hastToHTML = require('hast-util-to-html')

// getExcerptAst
const { getConcatenatedValue, cloneTreeUntil, findLastTextNode } = require('./hast-processing')

// getExcerptHtml
const hastToHTML = require('hast-util-to-html')

// getExcerptMarkdown
const unified = require('unified')
const stringify = require('remark-stringify')

// getExcerptPlain
const visit = require('unist-util-visit')
const prune = require('underscore.string/prune')
const _ = require('lodash')



const getAST = async markdownNode => {
	const ASTGenerationPromise = getMarkdownAST(markdownNode)
	ASTGenerationPromise.then(markdownAST => markdownAST).catch(error => error)
	return ASTGenerationPromise
}


const getMarkdownAST = async markdownNode => {
	// remark, basePath
	const markdownAST = remark.parse(markdownNode.internal.content)
	if (basePath) {
		visit(markdownAST, ['link', 'definition'], node => {
			if (node.url && node.url.startsWith('/') && !node.url.startsWith('//')) {
				const withPathPrefix = (url, pathPrefix) => (
					(pathPrefix + url).replace(/\/\//, '/')
				)
				node.url = withPathPrefix(node.url, basePath)
			}
		})
	}
	return markdownAST
}


const getHeadings = async markdownNode => {
	const ast = await getAST(markdownNode)
	const headings = select.selectAll('heading', ast).map(heading => {
		return {
			value: mdastToString(heading),
			depth: heading.depth
		}
	})
	return headings
}


//const getTableOfContents = async (markdownNode, gqlTocOptions) => {
const getTableOfContents = async (markdownNode, basePath, tocOptions, gqlTocOptions) => {
	// tocOptions, basePath
	let appliedTocOptions = { ...tocOptions, ...gqlTocOptions }
	const ast = await getAST(markdownNode)
	const tocAst = mdastToToc(ast, appliedTocOptions)
	let toc
	if (tocAst.map) {
		const addSlugToUrl = node => {
			if (node.url) {
				if (_.get(markdownNode, appliedTocOptions.pathToSlugField) === undefined) {
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
	return toc
}


const getHTMLAst = async markdownNode => {
	const ast = await getAST(markdownNode)
	const htmlAst = toHAST(ast, {
		allowDangerousHTML: true,
		handlers: { code: codeHandler }
	})
	return htmlAst
}


const getHTML = async markdownNode => {
	const ast = await getHTMLAst(markdownNode)
	const html = hastToHTML(ast, {
		allowDangerousHTML: true
	})
	return html
}


const getExcerptAst = async (fullAST, markdownNode, { pruneLength, truncate, excerptSeparator }) => {
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
				const SpaceMarkdownNodeTypesSet = new Set([
					'paragraph',
					'heading',
					'tableCell',
					'break'
				])
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


const getExcerpt = async (markdownNode, { format, pruneLength, truncate, excerptSeparator }) => {
	if (format === 'HTML') {
		return getExcerptHtml(markdownNode, pruneLength, truncate, excerptSeparator)
	} else if (format === 'MARKDOWN') {
		return getExcerptMarkdown(markdownNode, pruneLength, truncate, excerptSeparator)
	}
	return getExcerptPlain(markdownNode, pruneLength, truncate, excerptSeparator)
}


module.exports = {
	getAST,
	getMarkdownAST,
	getHeadings,
	getTableOfContents,
	getHTMLAst,
	getHTML,
	getExcerptAst,
	getExcerptHtml,
	getExcerptMarkdown,
	getExcerptPlain,
	getExcerpt
}


