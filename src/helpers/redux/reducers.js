



const _ = require('lodash')
const chalk = require('chalk')
const moment = require('moment')
const normalize = require('normalize-path')
const merge = require('webpack-merge')
const { interpret } = require('xstate')
const { oneLine } = require('common-tags')

/* const reduxNodes = require('./nodes') */
/* const lokiNodes = require('../../db/loki/nodes').reducer */
const componentMachine = require('./page-component')
const { gatsbyConfigSchema } = require('./joi')



const backend = process.env.GATSBY_DB_NODES || 'redux'


const reduxNodes = (state = new Map(), action) => {
	switch (action.type) {
		case 'DELETE_CACHE':
			return new Map()
		case 'CREATE_NODE': {
			state.set(action.payload.id, action.payload)
			return state
		}
		case 'ADD_FIELD_TO_NODE':
		case 'ADD_CHILD_NODE_TO_PARENT_NODE':
			state.set(action.payload.id, action.payload)
			return state
		case 'DELETE_NODE': {
			if (action.payload) {
				state.delete(action.payload.id)
			}
			return state
		}
		case 'DELETE_NODES': {
			action.payload.forEach(id => state.delete(id))
			return state
		}
		default:
			return state
	}
}


const reduxNodesByType = (state = new Map(), action) => {
	const getNodesOfType = (node, state) => {
		const { type } = node.internal
		if (!state.has(type)) {
			state.set(type, new Map())
		}
		return state.get(type)
	}
	switch (action.type) {
		case 'DELETE_CACHE':
			return new Map()
		case 'CREATE_NODE': {
			const node = action.payload
			const nodesOfType = getNodesOfType(node, state)
			nodesOfType.set(node.id, node)
			return state
		}
		case 'ADD_FIELD_TO_NODE':
		case 'ADD_CHILD_NODE_TO_PARENT_NODE': {
			const node = action.payload
			const nodesOfType = getNodesOfType(node, state)
			nodesOfType.set(node.id, node)
			return state
		}
		case 'DELETE_NODE': {
			const node = action.payload
			if (!node) return state
			const nodesOfType = getNodesOfType(node, state)
			nodesOfType.delete(node.id)
			if (!nodesOfType.size) {
				state.delete(node.internal.type)
			}
			return state
		}
		case 'DELETE_NODES': {
			const ids = action.payload
			ids.forEach(id => {
				Array.from(state).some(([type, nodes]) => {
					if (nodes.has(id)) {
						nodes.delete(id)
						if (!nodes.size) {
							state.delete(type)
						}
						return true
					}
					return false
				})
			})
			return state
		}
		default:
			return state
	}
}


const program = (state = { directory: '/', state: 'BOOTSTRAPPING' }, action) => {
	switch (action.type) {
		case 'SET_PROGRAM':
			return {
				...action.payload
			}
		case 'SET_PROGRAM_EXTENSIONS':
			return {
				...state,
				extensions: action.payload
			}
		case 'SET_PROGRAM_STATUS':
			return {
				...state,
				status: 'BOOTSTRAP_FINISHED'
			}
		default:
			return state
	}
}


const getNodesReducer = () => {
	let nodesReducer
	switch (backend) {
		case 'redux':
			nodesReducer = reduxNodes
			break
		/* case 'loki':
			nodesReducer = lokiNodes
			break */
		default:
			throw new Error(
				'Unsupported DB nodes backend (value of env var GATSBY_DB_NODES)'
			)
	}
	return nodesReducer
}


const getNodesByTypeReducer = () => {
	let nodesReducer
	switch (backend) {
		case 'redux':
			//nodesReducer = require('./nodes-by-type')
			nodesReducer = reduxNodesByType
			break
		/* case 'loki':
			nodesReducer = (state = null) => null
			break */
		default:
			throw new Error(
				'Unsupported DB nodes backend (value of env var GATSBY_DB_NODES)'
			)
	}
	return nodesReducer
}


const resolvedNodes = (state = new Map(), action) => {
	switch (action.type) {
		case 'DELETE_CACHE':
		case 'CREATE_NODE':
		case 'DELETE_NODE':
		case 'DELETE_NODES':
			return new Map()
		case 'SET_RESOLVED_NODES': {
			const { key, nodes } = action.payload
			state.set(key, nodes)
			return state
		}
		default:
			return state
	}
}


const nodesTouched = (state = new Set(), action) => {
	switch (action.type) {
		case 'CREATE_NODE':
			state.add(action.payload.id)
			return state
		case 'TOUCH_NODE':
			state.add(action.payload)
			return state
		default:
			return state
	}
}


const flattenedPlugins = (state = [], action) => {
	switch (action.type) {
		case 'SET_SITE_FLATTENED_PLUGINS':
			return [...action.payload]
		default:
			return state
	}
}


const config = (state = {}, action) => {
	switch (action.type) {
		case 'SET_SITE_CONFIG': {
			const result = gatsbyConfigSchema.validate(action.payload || {})
			const normalizedPayload = result.value
			if (result.error) {
				console.log(
					chalk.blue.bgYellow('The site\'s gatsby-config.js failed validation')
				)
				console.log(chalk.bold.red(result.error))
				if (normalizedPayload.linkPrefix) {
					console.log('"linkPrefix" should be changed to "pathPrefix"')
				}
				throw new Error('The site\'s gatsby-config.js failed validation')
			}
			return normalizedPayload
		}
		default:
			return state
	}
}


const pages = (state = new Map(), action) => {
	switch (action.type) {
		case 'DELETE_CACHE':
			return new Map()
		case 'CREATE_PAGE': {
			action.payload.component = normalize(action.payload.component)
			if (!action.plugin && !action.plugin.name) {
				console.log('')
				console.error(JSON.stringify(action, null, 4))
				console.log('')
				throw new Error(
					'Pages can only be created by plugins. There wasn\'t a plugin set when creating this page.'
				)
			}
			action.payload.pluginCreator___NODE = action.plugin.id
			action.payload.pluginCreatorId = action.plugin.id
			state.set(action.payload.path, action.payload)
			return state
		}
		case 'DELETE_PAGE': {
			state.delete(action.payload.path)
			return state
		}
		default:
			return state
	}
}


const schema = (state = {}, action) => {
	switch (action.type) {
		case 'SET_SCHEMA':
			return action.payload
		default:
			return state
	}
}


const status = (state = { plugins: {} }, action) => {
	switch (action.type) {
		case 'DELETE_CACHE':
			return { plugins: {} }
		case 'UPDATE_PLUGINS_HASH':
			return {
				...state,
				PLUGINS_HASH: action.payload
			}
		case 'SET_PLUGIN_STATUS':
			if (!action.plugin && !action.plugin.name) {
				throw new Error('You can\'t set plugin status without a plugin')
			}
			if (!_.isObject(action.payload)) {
				throw new Error(
					`You must pass an object into setPluginStatus. What was passed in was ${JSON.stringify(
						action.payload,
						null,
						4
					)}`
				)
			}
			return {
				...state,
				plugins: {
					...state.plugins,
					[action.plugin.name]: _.merge(
						{},
						state.plugins[action.plugin.name],
						action.payload
					)
				}
			}
		default:
			return state
	}
}


const componentDataDependencies = (state = { nodes: new Map(), connections: new Map() }, action) => {
	switch (action.type) {
		case 'DELETE_CACHE':
			return { nodes: new Map(), connections: new Map() }
		case 'CREATE_COMPONENT_DEPENDENCY':
			if (action.payload.path === '') {
				return state
			}
			if (action.payload.nodeId) {
				let existingPaths = new Set()
				if (state.nodes.has(action.payload.nodeId)) {
					existingPaths = state.nodes.get(action.payload.nodeId)
				}
				if (!existingPaths.has(action.payload.path || action.payload.id)) {
					existingPaths.add(action.payload.path || action.payload.id)
				}
				state.nodes.set(action.payload.nodeId, existingPaths)
			}
			if (action.payload.connection) {
				let existingPaths = new Set()
				if (state.connections.has(action.payload.connection)) {
					existingPaths = state.connections.get(action.payload.connection)
				}
				if (!existingPaths.has(action.payload.path || action.payload.id)) {
					existingPaths.add(action.payload.path || action.payload.id)
				}
				state.connections.set(action.payload.connection, existingPaths)
			}
			return state
		case 'DELETE_COMPONENTS_DEPENDENCIES':
			state.nodes.forEach((val, _key) => {
				for (const path of action.payload.paths) {
					val.delete(path)
				}
			})
			state.connections.forEach((val, _key) => {
				for (const path of action.payload.paths) {
					val.delete(path)
				}
			})
			return state
		default:
			return state
	}
}


const services = new Map()
let programStatus = 'BOOTSTRAPPING'


const components = (state = new Map(), action) => {
	switch (action.type) {
		case 'DELETE_CACHE':
			return new Map()
		case 'SET_PROGRAM_STATUS':
			programStatus = action.payload
			if (programStatus === 'BOOTSTRAP_QUERY_RUNNING_FINISHED') {
				services.forEach(s => s.send('BOOTSTRAP_FINISHED'))
			}
			return state
		case 'CREATE_PAGE': {
			action.payload.componentPath = normalize(action.payload.component)
			let service
			if (!services.has(action.payload.componentPath)) {
				const machine = componentMachine.withContext({
					componentPath: action.payload.componentPath,
					query: state.get(action.payload.componentPath)?.query || '',
					pages: new Set([action.payload.path]),
					isInBootstrap: programStatus === 'BOOTSTRAPPING'
				})
				service = interpret(machine).start()
				services.set(action.payload.componentPath, service)
			} else {
				service = services.get(action.payload.componentPath)
				if (!service.state.context.pages.has(action.payload.path)) {
					service.send({ type: 'NEW_PAGE_CREATED', path: action.payload.path })
				} else if (action.contextModified) {
					service.send({
						type: 'PAGE_CONTEXT_MODIFIED',
						path: action.payload.path
					})
				}
			}
			state.set(
				action.payload.componentPath,
				Object.assign({ query: '' }, service.state.context)
			)
			return state
		}
		case 'QUERY_EXTRACTED': {
			action.payload.componentPath = normalize(action.payload.componentPath)
			const service = services.get(action.payload.componentPath)
			if (service.state.value === 'queryExtractionBabelError') {
				return state
			}
			if (service.state.context.query === action.payload.query) {
				service.send('QUERY_DID_NOT_CHANGE')
			} else {
				service.send({
					type: 'QUERY_CHANGED',
					query: action.payload.query
				})
			}
			state.set(action.payload.componentPath, {
				...service.state.context
			})
			return state
		}
		case 'QUERY_EXTRACTION_BABEL_SUCCESS':
		case 'QUERY_EXTRACTION_BABEL_ERROR':
		case 'QUERY_EXTRACTION_GRAPHQL_ERROR': {
			let servicesToSendEventTo
			if (
				typeof action.payload.componentPath !== 'string' &&
				action.type === 'QUERY_EXTRACTION_GRAPHQL_ERROR'
			) {
				servicesToSendEventTo = services
			} else {
				action.payload.componentPath = normalize(action.payload.componentPath)
				servicesToSendEventTo = [
					services.get(action.payload.componentPath)
				].filter(Boolean)
			}
			servicesToSendEventTo.forEach(service =>
				service.send({
				type: action.type,
					...action.payload
				})
			)
			return state
		}
		case 'PAGE_QUERY_RUN': {
			if (action.payload.isPage) {
				action.payload.componentPath = normalize(action.payload.componentPath)
				const service = services.get(action.payload.componentPath)
				service.send({
					type: 'QUERIES_COMPLETE'
				})
			}
			return state
		}
		case 'REMOVE_TEMPLATE_COMPONENT': {
			action.payload.componentPath = normalize(action.payload.componentPath)
			state.delete(action.payload.componentPath)
			return state
		}
		case 'DELETE_PAGE': {
			const service = services.get(normalize(action.payload.component))
			service.send({
				type: 'DELETE_PAGE',
				page: action.payload
			})
			return state
		}
	}
	return state
}


const staticQueryComponents = (state = new Map(), action) => {
	switch (action.type) {
		case 'DELETE_CACHE':
			return new Map()
		case 'REPLACE_STATIC_QUERY':
			return state.set(action.payload.id, action.payload)
		case 'REMOVE_STATIC_QUERY':
			state.delete(action.payload)
			return state
	}
	return state
}


const jobs = (state = { active: [], done: [] }, action) => {
	switch (action.type) {
		case 'CREATE_JOB':
		case 'SET_JOB': {
			if (!action.payload.id) {
				throw new Error('An ID must be provided when creating or setting job')
			}
			const index = _.findIndex(state.active, j => j.id === action.payload.id)
			if (index !== -1) {
				const mergedJob = _.merge(state.active[index], {
					...action.payload,
					createdAt: Date.now(),
					plugin: action.plugin
				})
				state.active[index] = mergedJob
				return state
			} else {
				state.active.push({
					...action.payload,
					createdAt: Date.now(),
					plugin: action.plugin
				})
				return state
			}
		}
		case 'END_JOB': {
			if (!action.payload.id) {
				throw new Error('An ID must be provided when ending a job')
			}
			const completedAt = Date.now()
			const index = _.findIndex(state.active, j => j.id === action.payload.id)
			if (index === -1) {
				throw new Error(oneLine`
					The plugin "${_.get(action, 'plugin.name', 'anonymous')}"
					tried to end a job with the id "${action.payload.id}"
					that either hasn't yet been created or has already been ended
				`)
			}
			const job = state.active.splice(index, 1)[0]
			state.done.push({
				...job,
				completedAt,
				runTime: moment(completedAt).diff(moment(job.createdAt))
			})
			return state
		}
	}
	return state
}


const webpack = (state = {}, action) => {
	switch (action.type) {
		case 'SET_WEBPACK_CONFIG': {
			let nextConfig = action.payload
			delete nextConfig.entry
			delete nextConfig.output
			delete nextConfig.target
			delete nextConfig.resolveLoaders
			return merge(state, nextConfig)
		}
		case 'REPLACE_WEBPACK_CONFIG':
			return { ...action.payload }
		default:
			return state
	}
}


const webpackCompilationHash = (state = '', action) => {
	switch (action.type) {
		case 'SET_WEBPACK_COMPILATION_HASH':
			return action.payload
		default:
			return state
	}
}


const redirectsMap = new Map()


const redirects = (state = [], action) => {
	const exists = (newRedirect) => {
		if (!redirectsMap.has(newRedirect.fromPath)) {
			return false
		}
		return redirectsMap.get(newRedirect.fromPath).some(redirect => (
			_.isEqual(redirect, newRedirect)
		))
	}
	const add = (redirect) => {
		let samePathRedirects = redirectsMap.get(redirect.fromPath)
		if (!samePathRedirects) {
			samePathRedirects = []
			redirectsMap.set(redirect.fromPath, samePathRedirects)
		}
		samePathRedirects.push(redirect)
	}
	switch (action.type) {
		case 'CREATE_REDIRECT': {
			const redirect = action.payload
			if (!exists(redirect)) {
				add(redirect)
				state.push(redirect)
			}
			return state
		}
		default:
			return state
	}
}


const babelrc = (
	state = {
		stages: {
			develop: {
				plugins: [],
				presets: [],
				options: {
					cacheDirectory: true,
					sourceType: 'unambiguous'
				},
			},
			'develop-html': {
				plugins: [],
				presets: [],
				options: {
					cacheDirectory: true,
					sourceType: 'unambiguous'
				},
			},
			'build-html': {
				plugins: [],
				presets: [],
				options: {
					cacheDirectory: true,
					sourceType: 'unambiguous'
				}
			},
			'build-javascript': {
				plugins: [],
				presets: [],
				options: {
					cacheDirectory: true,
					sourceType: 'unambiguous'
				}
			}
		}
	},
	action
) => {
	switch (action.type) {
		case 'SET_BABEL_PLUGIN': {
			Object.keys(state.stages).forEach(stage => {
				if (action.payload.stage && action.payload.stage !== stage) {
					return
				}
				const index = _.findIndex(
					state.stages[stage].plugins,
					p => p.name === action.payload.name
				)
				if (index !== -1) {
					const plugin = state.stages[stage].plugins[index]
					state.stages[stage].plugins[index] = {
						name: plugin.name,
						options: _.merge(plugin.options, action.payload.options)
					}
				} else {
					state.stages[stage].plugins = [
						...state.stages[stage].plugins,
						action.payload
					]
				}
			})
			return state
		}
		case 'SET_BABEL_PRESET': {
			Object.keys(state.stages).forEach(stage => {
				if (action.payload.stage && action.payload.stage !== stage) {
					return
				}
				const index = _.findIndex(
					state.stages[stage].presets,
					p => p.name === action.payload.name
				)
				if (index !== -1) {
					const plugin = state.stages[stage].presets[index]
					state.stages[stage].presets[index] = {
						name: plugin.name,
						options: _.merge(plugin.options, action.payload.options)
					}
				} else {
					state.stages[stage].presets = [
						...state.stages[stage].presets,
						action.payload
					]
				}
			})
			return state
		}
		case 'SET_BABEL_OPTIONS': {
			Object.keys(state.stages).forEach(stage => {
				if (action.payload.stage && action.payload.stage !== stage) {
					return
				}
				state.stages[stage].options = {
					...state.stages[stage].options,
					...action.payload.options
				}
			})
			return state
		}
	}
	return state
}


const schemaCustomization = (
	state = {
		composer: null,
		context: {},
		fieldExtensions: {},
		printConfig: null,
		thirdPartySchemas: [],
		types: []
	},
	action
) => {
	switch (action.type) {
		case 'ADD_THIRD_PARTY_SCHEMA':
			return {
				...state,
				thirdPartySchemas: [...state.thirdPartySchemas, action.payload]
			}
		case 'SET_SCHEMA_COMPOSER':
			return {
				...state,
				composer: action.payload
			}
		case 'CREATE_TYPES': {
			let types
			if (Array.isArray(action.payload)) {
				types = [
					...state.types,
					...action.payload.map(typeOrTypeDef => {
						return {
							typeOrTypeDef,
							plugin: action.plugin
						}
					})
				]
			} else {
				types = [
					...state.types,
					{ typeOrTypeDef: action.payload, plugin: action.plugin }
				]
			}
			return {
				...state,
				types
			}
		}
		case 'CREATE_FIELD_EXTENSION': {
			const { extension, name } = action.payload
			return {
				...state,
				fieldExtensions: { ...state.fieldExtensions, [name]: extension }
			}
		}
		case 'PRINT_SCHEMA_REQUESTED': {
			const { path, include, exclude, withFieldTypes } = action.payload
			return {
				...state,
				printConfig: {
					path,
					include,
					exclude,
					withFieldTypes
				}
			}
		}
		case 'CREATE_RESOLVER_CONTEXT': {
			const context = action.payload
			return {
				...state,
				context: { ...state.context, ...context }
			}
		}
		case 'CLEAR_SCHEMA_CUSTOMIZATION':
			return {
				...{
					composer: null,
					context: {},
					fieldExtensions: {},
					printConfig: null,
					thirdPartySchemas: [],
					types: []
				},
				composer: state.composer
			}
		case 'DELETE_CACHE':
			return {
				composer: null,
				context: {},
				fieldExtensions: {},
				printConfig: null,
				thirdPartySchemas: [],
				types: []
			}
		default:
			return state
	}
}


const themes = (state = {}, action) => {
	switch (action.type) {
		case 'SET_RESOLVED_THEMES':
			return {
				...state,
				themes: action.payload
			}
		default:
			return state
	}
}


module.exports = {
	program: program,
	nodes: getNodesReducer(),
	nodesByType: getNodesByTypeReducer(),
	resolvedNodesCache: resolvedNodes,
	nodesTouched: nodesTouched,
	lastAction: (state = null, action) => action,
	flattenedPlugins: flattenedPlugins,
	config: config,
	pages: pages,
	schema: schema,
	status: status,
	componentDataDependencies: componentDataDependencies,
	components: components,
	staticQueryComponents: staticQueryComponents,
	jobs: jobs,
	webpack: webpack,
	webpackCompilationHash: webpackCompilationHash,
	redirects: redirects,
	babelrc: babelrc,
	schemaCustomization: schemaCustomization,
	themes: themes,
	/* logs: require('gatsby-cli/lib/reporter/redux/reducer'),
	inferenceMetadata: require('./inference-metadata') */
	logs: () => { throw new Error('The logs reducer is missing its implementation') },
	inferenceMetadata: () => { throw new Error('The inferenceMetadata reducer is missing its implementation') }
}


