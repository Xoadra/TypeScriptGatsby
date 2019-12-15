



const _ = require('lodash')
const fs = require('fs')
const url = require('url')
const path = require('path')
const chalk = require('chalk')
const Joi = require('@hapi/joi')
const fileExistsSync = require('fs-exists-cached').sync
/* const report = require('gatsby-cli/lib/reporter') */
const { platform } = require('os')
const { trueCasePathSync } = require('true-case-path')
const { stripIndent } = require('common-tags')
/* const { trackCli } = require('gatsby-telemetry') */

const joiSchemas = require('../redux/joi')
const sanitizeNode = require('./sanitize')
const apiRunnerNode = require('./runner')
const generateComponentChunkName = require('./js-chunk-names')
const { hasNodeChanged, getNode } = require('../nodes')
const { getNonGatsbyCodeFrame } = require('./trace-utils')
const { getCommonDir } = require('./path')
const { store } = require('../redux/store')



const shadowCreatePagePath = _.memoize(require('./create-page-shadow'))

const isWindows = platform() === 'win32'


const slash = path => {
	const isExtendedLengthPath = /^\\\\\?\\/.test(path)
	if (isExtendedLengthPath) {
		return path
	}
	return path.replace(/\\/g, '/')
}


const ensureWindowsDriveIsUppercase = filePath => {
	const segments = filePath.split(':').filter(s => s !== '')
	return segments.length > 0
		? segments.shift().toUpperCase() + ':' + segments.join(':')
		: filePath
}


const findChildren = initialChildren => {
	const children = [...initialChildren]
	const queue = [...initialChildren]
	const traversedNodes = new Set()
	while (queue.length > 0) {
		const currentChild = getNode(queue.pop())
		if (!currentChild || traversedNodes.has(currentChild.id)) {
		continue
		}
		traversedNodes.add(currentChild.id)
		const newChildren = currentChild.children
		if (_.isArray(newChildren) && newChildren.length > 0) {
		children.push(...newChildren)
		queue.push(...newChildren)
		}
	}
	return children
}


const deletePage = page => {
	return {
		type: 'DELETE_PAGE',
		payload: page
	}
}


const pascalCase = _.flow(_.camelCase, _.upperFirst)
const hasWarnedForPageComponentInvalidContext = new Set()
const hasWarnedForPageComponentInvalidCasing = new Set()
const hasErroredBecauseOfNodeValidation = new Set()
const pageComponentCache = {}
const fileOkCache = {}


const createPage = (page, plugin, actionOptions) => {
	let name = `The plugin "${plugin.name}"`
	if (plugin.name === 'default-site-plugin') {
		name = 'Your site\'s "gatsby-node.js"'
	}
	if (!page.path) {
		const message = `${name} must set the page path when creating a page`
		if (process.env.NODE_ENV !== 'test') {
			/* report.panic({
				id: '11323',
				context: {
					pluginName: name,
					pageObject: page,
					message
				},
			}) */
			throw new Error(`An error occurred in the createPage action: ${message}`)
		} else {
			return message
		}
	}
	if (_.isObject(page.context)) {
		const reservedFields = [
			'path',
			'matchPath',
			'component',
			'componentChunkName',
			'pluginCreator___NODE',
			'pluginCreatorId'
		]
		const invalidFields = Object.keys(_.pick(page.context, reservedFields))
		const singularMessage = `${name} used a reserved field name in the context object when creating a page:`
		const pluralMessage = `${name} used reserved field names in the context object when creating a page:`
		if (invalidFields.length > 0) {
			const error = `
				${invalidFields.length === 1 ? singularMessage : pluralMessage}
				${invalidFields.map(f => `  * "${f}"`).join('\n')}
				${JSON.stringify(page, null, 4)}
				Data in "context" is passed to GraphQL as potential arguments when running the
				page query.
				When arguments for GraphQL are constructed, the context object is combined with
				the page object so *both* page object and context data are available as
				arguments. So you don't need to add the page "path" to the context as it's
				already available in GraphQL. If a context field duplicates a field already
				used by the page object, this can break functionality within Gatsby so must be
				avoided.
				Please choose another name for the conflicting fields.
				The following fields are used by the page object and should be avoided.
				${reservedFields.map(f => `  * "${f}"`).join('\n')}
			`
			if (process.env.NODE_ENV === 'test') {
				return error
			} else if (invalidFields.some(f => page.context[f] !== page[f])) {
				/* report.panic({
					id: '11324',
					context: {
						message: error
					}
				}) */
				throw new Error(`An error occurred in the createPage action: ${error}`)
			} else {
				if (!hasWarnedForPageComponentInvalidContext.has(page.component)) {
					//report.warn(error)
					console.error(error)
					hasWarnedForPageComponentInvalidContext.add(page.component)
				}
			}
		}
	}
	if (!page.component) {
		const issue = 'A component must be set when creating a page'
		if (process.env.NODE_ENV !== 'test') {
			/* report.panic({
				id: '11322',
				context: {
					pluginName: name,
					pageObject: page
				}
			}) */
			throw new Error(`An error occurred in the createPage action: ${issue}`)
		} else {
			return issue
		}
	}
	const pageComponentPath = shadowCreatePagePath(page.component)
	if (pageComponentPath) {
		page.component = pageComponentPath
	}
	if (process.env.NODE_ENV !== 'test') {
		if (!fileExistsSync(page.component)) {
			/* report.panic({
				id: '11325',
				context: {
					pluginName: name,
					pageObject: page,
					component: page.component
				}
			}) */
			const problem = 'File doesn\'t exist for this page component'
			throw new Error(`An error occurred in the createPage action: ${problem}`)
		}
	}
	if (!path.isAbsolute(page.component)) {
		const message = `${name} must set the absolute path to the page component when create creating a page`
		if (process.env.NODE_ENV !== 'test') {
			/* report.panic({
				id: '11326',
				context: {
					pluginName: name,
					pageObject: page,
					component: page.component
				}
			}) */
			throw new Error(`An error occurred in the createPage action: ${message}`)
		} else {
			return message
		}
	}
	if (process.env.NODE_ENV !== 'test') {
		if (pageComponentCache[page.component]) {
			page.component = pageComponentCache[page.component]
		} else {
			const originalPageComponent = page.component
			page.component = slash(page.component)
			let trueComponentPath
			try {
				trueComponentPath = slash(trueCasePathSync(page.component))
			} catch (e) {
				const commonDir = getCommonDir(
					store.getState().program.directory,
					page.component
				)
				const relativePath = slash(
					path.win32.relative(commonDir, page.component)
				)
				trueComponentPath = slash(trueCasePathSync(relativePath, commonDir))
			}
			if (isWindows) {
				page.component = ensureWindowsDriveIsUppercase(page.component)
			}
			if (trueComponentPath !== page.component) {
				if (!hasWarnedForPageComponentInvalidCasing.has(page.component)) {
					const markers = page.component.split('').map((letter, index) => {
						if (letter !== trueComponentPath[index]) {
							return '^'
						}
						return ' '
					}).join('')
					/* report.warn(stripIndent`
						${name} created a page with a component path that doesn't match the casing of the actual file. This may work locally, but will break on systems which are case-sensitive, e.g. most CI/CD pipelines.
						page.component:     "${page.component}"
						path in filesystem: "${trueComponentPath}"
											${markers}
					`) */
					console.error(stripIndent`
						${name} created a page with a component path that doesn't match the casing of the actual file. This may work locally, but will break on systems which are case-sensitive, e.g. most CI/CD pipelines.
						page.component:     "${page.component}"
						path in filesystem: "${trueComponentPath}"
											${markers}
					`)
					hasWarnedForPageComponentInvalidCasing.add(page.component)
				}
				page.component = trueComponentPath
			}
			pageComponentCache[originalPageComponent] = page.component
		}
	}
	let internalComponentName
	if (page.path === '/') {
		internalComponentName = 'ComponentIndex'
	} else {
		internalComponentName = `Component${pascalCase(page.path)}`
	}
	let internalPage = {
		internalComponentName,
		path: page.path,
		matchPath: page.matchPath,
		component: page.component,
		componentChunkName: generateComponentChunkName(page.component),
		isCreatedByStatefulCreatePages:
			actionOptions && actionOptions.traceId === 'initial-createPagesStatefully',
		context: page.context || {},
		updatedAt: Date.now()
	}
	if (internalPage.path[0] !== '/') {
		internalPage.path = `/${internalPage.path}`
	}
	if (
		!internalPage.component.includes('/.cache/') &&
		process.env.NODE_ENV === 'production' &&
		!fileOkCache[internalPage.component]
	) {
		const fileName = internalPage.component
		const fileContent = fs.readFileSync(fileName, 'utf-8')
		let notEmpty = true
		let includesDefaultExport = true
		if (fileContent === '') {
			notEmpty = false
		}
		if (
			!fileContent.includes('export default') &&
			!fileContent.includes('module.exports') &&
			!fileContent.includes('exports.default') &&
			!fileContent.includes('exports["default"]') &&
			!fileContent.match(/export \{.* as default.*\}/s) &&
			/\.(jsx?|tsx?)/.test(path.extname(fileName))
		) {
			includesDefaultExport = false
		}
		if (!notEmpty || !includesDefaultExport) {
			const relativePath = path.relative(
				store.getState().program.directory,
				fileName
			)
			if (!notEmpty) {
				/* report.panicOnBuild({
					id: '11327',
					context: {
						relativePath
					}
				}) */
				throw new Error(
					`An error occurred in the createPage action: File content is empty at ${relativePath}`
				)
			}
			if (!includesDefaultExport) {
				/* report.panicOnBuild({
					id: '11328',
					context: {
						fileName
					}
				}) */
				throw new Error(
					`An error occurred in the createPage action: Default import is missing in ${fileName}`
				)
			}
		}
		fileOkCache[internalPage.component] = true
	}
	const oldPage = store.getState().pages.get(internalPage.path)
	const contextModified = !!oldPage && !_.isEqual(oldPage.context, internalPage.context)
	const alternateSlashPath = page.path.endsWith('/') ? page.path.slice(0, -1) : page.path + '/'
	if (store.getState().pages.has(alternateSlashPath)) {
		/* report.warn(
			chalk.bold.yellow('Non-deterministic routing danger: ') +
			`Attempting to create page: "${page.path}", but page "${alternateSlashPath}" already exists\n` +
			chalk.bold.yellow('This could lead to non-deterministic routing behavior')
		) */
		console.error(
			chalk.bold.yellow('Non-deterministic routing danger: ') +
			`Attempting to create page: "${page.path}", but page "${alternateSlashPath}" already exists\n` +
			chalk.bold.yellow('This could lead to non-deterministic routing behavior')
		)
	}
	return {
		...actionOptions,
		type: 'CREATE_PAGE',
		contextModified,
		plugin,
		payload: internalPage
	}
}


const deleteNode = (options, plugin, args) => {
	let id
	if (typeof options === 'string') {
		let msg = `
			Calling "deleteNode" with a nodeId is deprecated. Please pass an 
			object containing a full node instead: deleteNode({ node }).
		`
		if (args && args.name) {
			plugin = args
			msg = msg + ` "deleteNode" was called by ${plugin.name}`
		}
		//report.warn(msg)
		console.error(msg)
		id = options
	} else {
		id = options && options.node && options.node.id
	}
	const node = getNode(id)
	if (plugin) {
		const pluginName = plugin.name
		if (node && typeOwners[node.internal.type] !== pluginName) {
			throw new Error(stripIndent`
				The plugin "${pluginName}" deleted a node of a type owned by another plugin.
				The node type "${node.internal.type}" is owned by "${typeOwners[node.internal.type]}".
				The node object passed to "deleteNode":
				${JSON.stringify(node, null, 4)}
				The plugin deleting the node:
				${JSON.stringify(plugin, null, 4)}
			`)
		}
	}
	const createDeleteAction = node => {
		return {
			type: 'DELETE_NODE',
			plugin,
			payload: node
		}
	}
	const deleteAction = createDeleteAction(node)
	const deleteDescendantsActions = node && findChildren(node.children).map(getNode).map(createDeleteAction)
	if (deleteDescendantsActions && deleteDescendantsActions.length) {
		return [...deleteDescendantsActions, deleteAction]
	} else {
		return deleteAction
	}
}


const deleteNodes = (nodes, plugin) => {
	let msg = `
		The "deleteNodes" action is now deprecated and will be removed in 
		Gatsby v3. Please use "deleteNode" instead.
	`
	if (plugin && plugin.name) {
		msg = msg + ` "deleteNodes" was called by ${plugin.name}`
	}
	//report.warn(msg)
	console.error(msg)
	const descendantNodes = _.flatten(
		nodes.map(n => findChildren(getNode(n).children))
	)
	const nodeIds = [...nodes, ...descendantNodes]
	const deleteNodesAction = {
		type: 'DELETE_NODES',
		plugin,
		payload: nodeIds,
		fullNodes: nodeIds.map(getNode)
	}
	return deleteNodesAction
}


let NODE_COUNTER = 0

const typeOwners = {}


const createNodeHelper = (node, plugin, actionOptions = {}) => {
	if (!_.isObject(node)) {
		return console.log(chalk.bold.red(
			'The node passed to the "createNode" action creator must be an object'
		))
	}
	if (!node.internal) {
		node.internal = {}
	}
	NODE_COUNTER++
	node.internal.counter = NODE_COUNTER
	if (!node.array && !_.isArray(node.children)) {
		node.children = []
	}
	if (!node.parent) {
		node.parent = null
	}
	if (node.internal.owner) {
		//report.error(JSON.stringify(node, null, 4))
		console.error(JSON.stringify(node, null, 4))
		/* report.panic(chalk.bold.red(
			'The node internal.owner field is set automatically by Gatsby and not by plugins'
		)) */
		throw new Error(
			'An error occurred in the createNode action helper function: The node internal.owner field is set automatically by Gatsby and not by plugins'
		)
	}
	const trackParams = {}
	if (plugin) {
		node.internal.owner = plugin.name
		trackParams['pluginName'] = `${plugin.name}@${plugin.version}`
	}
	//trackCli('CREATE_NODE', trackParams, { debounce: true })
	const result = Joi.validate(node, joiSchemas.nodeSchema)
	if (result.error) {
		if (!hasErroredBecauseOfNodeValidation.has(result.error.message)) {
			const errorObj = {
				id: '11467',
				context: {
					validationErrorMessage: result.error.message,
					node
				}
			}
			const possiblyCodeFrame = getNonGatsbyCodeFrame()
			if (possiblyCodeFrame) {
				errorObj.context.codeFrame = possiblyCodeFrame.codeFrame
				errorObj.filePath = possiblyCodeFrame.fileName
				errorObj.location = {
					start: {
						line: possiblyCodeFrame.line,
						column: possiblyCodeFrame.column
					}
				}
			}
			report.error(errorObj)
			hasErroredBecauseOfNodeValidation.add(result.error.message)
		}
		return { type: 'VALIDATION_ERROR', error: true }
	}
	if (node.fields) {
		throw new Error(stripIndent`
			Plugins creating nodes can not set data on the reserved field "fields"
			as this is reserved for plugins which wish to extend your nodes.
			If your plugin didn't add "fields" you're probably seeing this
			error because you're reusing an old node object.
			Node:
			${JSON.stringify(node, null, 4)}
			Plugin that created the node:
			${JSON.stringify(plugin, null, 4)}
		`)
	}
	node = sanitizeNode(node)
	const oldNode = getNode(node.id)
	if (plugin) {
		let pluginName = plugin.name
		if (!typeOwners[node.internal.type]) {
			typeOwners[node.internal.type] = pluginName
		} else if (typeOwners[node.internal.type] !== pluginName) {
			throw new Error(stripIndent`
				The plugin "${pluginName}" created a node of a type owned by another plugin.
				The node type "${node.internal.type}" is owned by "${typeOwners[node.internal.type]}".
				If you copy and pasted code from elsewhere, you'll need to pick a new type name
				for your new node(s).
				The node object passed to "createNode":
				${JSON.stringify(node, null, 4)}
				The plugin creating the node:
				${JSON.stringify(plugin, null, 4)}
			`)
		}
		if (oldNode && oldNode.internal.owner !== pluginName) {
			throw new Error(stripIndent`
				Nodes can only be updated by their owner. Node "${node.id}" is
				owned by "${oldNode.internal.owner}" and another plugin "${pluginName}"
				tried to update it.
			`)
		}
	}
	if (actionOptions.parentSpan) {
		actionOptions.parentSpan.setTag('nodeId', node.id)
		actionOptions.parentSpan.setTag('nodeType', node.id)
	}
	let deleteActions
	let updateNodeAction
	if (oldNode && !hasNodeChanged(node.id, node.internal.contentDigest)) {
		updateNodeAction = {
			...actionOptions,
			plugin,
			type: 'TOUCH_NODE',
			payload: node.id
		}
	} else {
		if (oldNode) {
			const createDeleteAction = node => {
				return {
					...actionOptions,
					type: 'DELETE_NODE',
					plugin,
					payload: node
				}
			}
			deleteActions = findChildren(oldNode.children).map(getNode).map(createDeleteAction)
		}
		updateNodeAction = {
			...actionOptions,
			type: 'CREATE_NODE',
			plugin,
			oldNode,
			payload: node
		}
	}
	if (deleteActions && deleteActions.length) {
		return [...deleteActions, updateNodeAction]
	} else {
		return updateNodeAction
	}
}


const createNode = (...args) => dispatch => {
	const actions = createNodeHelper(...args)
	dispatch(actions)
	const createNodeAction = (Array.isArray(actions) ? actions : [actions]).find(
		action => action.type === 'CREATE_NODE'
	)
	if (!createNodeAction) {
		return undefined
	}
	const { payload: node, traceId, parentSpan } = createNodeAction
	return apiRunnerNode('onCreateNode', {
		node,
		traceId,
		parentSpan,
		traceTags: { nodeId: node.id, nodeType: node.internal.type }
	})
}


const touchNode = (options, plugin) => {
	let nodeId = _.get(options, 'nodeId')
	if (typeof options === 'string') {
		console.warn(
			'Calling "touchNode" with a nodeId is deprecated. Please pass an object containing a nodeId instead: touchNode({ nodeId: \'a-node-id\' })'
		)
		if (plugin && plugin.name) {
			console.log(`"touchNode" was called by ${plugin.name}`)
		}
		nodeId = options
	}
	const node = getNode(nodeId)
	if (node && !typeOwners[node.internal.type]) {
		typeOwners[node.internal.type] = node.internal.owner
	}
	return {
		type: 'TOUCH_NODE',
		plugin,
		payload: nodeId
	}
}


const createNodeField = ({ node, name, value, fieldName, fieldValue }, plugin, actionOptions) => {
	if (fieldName) {
		console.warn(
			'Calling "createNodeField" with "fieldName" is deprecated. Use "name" instead'
		)
		if (!name) {
			name = fieldName
		}
	}
	if (fieldValue) {
		console.warn(
			'Calling "createNodeField" with "fieldValue" is deprecated. Use "value" instead'
		)
		if (!value) {
			value = fieldValue
		}
	}
	if (!node.internal.fieldOwners) {
		node.internal.fieldOwners = {}
	}
	if (!node.fields) {
		node.fields = {}
	}
	const schemaFieldName = _.includes(name, '___NODE') ? name.split('___')[0] : name
	const fieldOwner = node.internal.fieldOwners[schemaFieldName]
	if (fieldOwner && fieldOwner !== plugin.name) {
		throw new Error(stripIndent`
			A plugin tried to update a node field that it doesn't own:
			Node id: ${node.id}
			Plugin: ${plugin.name}
			name: ${name}
			value: ${value}
		`)
	}
	node.fields[name] = value
	node.internal.fieldOwners[schemaFieldName] = plugin.name
	node = sanitizeNode(node)
	return {
		...actionOptions,
		type: 'ADD_FIELD_TO_NODE',
		plugin,
		payload: node,
		addedField: name
	}
}


const createParentChildLink = ({ parent, child }, plugin) => {
	parent.children.push(child.id)
	parent.children = _.uniq(parent.children)
	return {
		type: 'ADD_CHILD_NODE_TO_PARENT_NODE',
		plugin,
		payload: parent
	}
}


const setWebpackConfig = (config, plugin = null) => {
	return {
		type: 'SET_WEBPACK_CONFIG',
		plugin,
		payload: config
	}
}


const replaceWebpackConfig = (config, plugin = null) => {
	return {
		type: 'REPLACE_WEBPACK_CONFIG',
		plugin,
		payload: config
	}
}


const setBabelOptions = (options, plugin = null) => {
	let name = `The plugin "${plugin.name}"`
	if (plugin.name === 'default-site-plugin') {
		name = 'Your site\'s "gatsby-node.js"'
	}
	if (!_.isObject(options)) {
		console.log(`${name} must pass an object to "setBabelOptions"`)
		console.log(JSON.stringify(options, null, 4))
		if (process.env.NODE_ENV !== 'test') {
			process.exit(1)
		}
	}
	if (!_.isObject(options.options)) {
		console.log(`${name} must pass options to "setBabelOptions"`)
		console.log(JSON.stringify(options, null, 4))
		if (process.env.NODE_ENV !== 'test') {
			process.exit(1)
		}
	}
	return {
		type: 'SET_BABEL_OPTIONS',
		plugin,
		payload: options
	}
}


const setBabelPlugin = (config, plugin = null) => {
	let name = `The plugin "${plugin.name}"`
	if (plugin.name === 'default-site-plugin') {
		name = 'Your site\'s "gatsby-node.js"'
	}
	if (!config.name) {
		console.log(`${name} must set the name of the Babel plugin`)
		console.log(JSON.stringify(config, null, 4))
		if (process.env.NODE_ENV !== 'test') {
			process.exit(1)
		}
	}
	if (!config.options) {
		config.options = {}
	}
	return {
		type: 'SET_BABEL_PLUGIN',
		plugin,
		payload: config
	}
}


const setBabelPreset = (config, plugin = null) => {
	let name = `The plugin "${plugin.name}"`
	if (plugin.name === 'default-site-plugin') {
		name = 'Your site\'s "gatsby-node.js"'
	}
	if (!config.name) {
		console.log(`${name} must set the name of the Babel preset`)
		console.log(JSON.stringify(config, null, 4))
		if (process.env.NODE_ENV !== 'test') {
			process.exit(1)
		}
	}
	if (!config.options) {
		config.options = {}
	}
	return {
		type: 'SET_BABEL_PRESET',
		plugin,
		payload: config
	}
}


const createJob = (job, plugin = null) => {
	return {
		type: 'CREATE_JOB',
		plugin,
		payload: job
	}
}


const setJob = (job, plugin = null) => {
	return {
		type: 'SET_JOB',
		plugin,
		payload: job
	}
}


const endJob = (job, plugin = null) => {
	return {
		type: 'END_JOB',
		plugin,
		payload: job
	}
}


const setPluginStatus = (status, plugin) => {
	return {
		type: 'SET_PLUGIN_STATUS',
		plugin,
		payload: status
	}
}


const maybeAddPathPrefix = (path, pathPrefix) => {
	const parsed = url.parse(path)
	const isRelativeProtocol = path.startsWith('//')
	return `${parsed.protocol != null || isRelativeProtocol ? '' : pathPrefix}${path}`
}


const createRedirect = ({ fromPath, isPermanent = false, redirectInBrowser = false, toPath, ...rest }) => {
	let pathPrefix = ''
	if (store.getState().program.prefixPaths) {
		pathPrefix = store.getState().config.pathPrefix
	}
	return {
		type: 'CREATE_REDIRECT',
		payload: {
			fromPath: maybeAddPathPrefix(fromPath, pathPrefix),
			isPermanent,
			redirectInBrowser,
			toPath: maybeAddPathPrefix(toPath, pathPrefix),
			...rest
		}
	}
}


const createPageDependency = ({ path, nodeId, connection }, plugin = '') => {
	console.warn(
		'Calling "createPageDependency" directly from actions in deprecated. Use "createPageDependency" from "gatsby/dist/redux/actions/add-page-dependency".'
	)
	return {
		type: 'CREATE_COMPONENT_DEPENDENCY',
		plugin,
		payload: {
			path,
			nodeId,
			connection
		}
	}
}


const actions = {
	deletePage,
	createPage,
	deleteNode,
	deleteNodes,
	createNode,
	touchNode,
	createNodeField,
	createParentChildLink,
	setWebpackConfig,
	replaceWebpackConfig,
	setBabelOptions,
	setBabelPlugin,
	setBabelPreset,
	createJob,
	setJob,
	endJob,
	setPluginStatus,
	createRedirect,
	createPageDependency
}


module.exports = { actions }


