



const _ = require('lodash')
const chalk = require('chalk')
const tracer = require('opentracing').globalTracer()
const { bindActionCreators } = require('redux')
/* const reporter = require('gatsby-cli/lib/reporter') */
/* const { trackBuildError, decorateEvent } = require('gatsby-telemetry') */

const getCache = require('../get-cache')
const createNodeId = require('../create-node-id')
const createContentDigest = require('../content-digest')
const getPublicPath = require('./get-public-path')
const {
	buildObjectType,
	buildUnionType,
	buildInterfaceType,
	buildInputObjectType,
	buildEnumType,
	buildScalarType
} = require('./type-builders')
const { emitter, store } = require('../redux/store')
const { getNonGatsbyCodeFrameFormatted } = require('./trace-utils')



const boundPluginActionCreators = {}


const doubleBind = (boundActionCreators, api, plugin, actionOptions) => {
	const { traceId } = actionOptions
	if (boundPluginActionCreators[plugin.name + api + traceId]) {
		return boundPluginActionCreators[plugin.name + api + traceId]
	} else {
		const keys = Object.keys(boundActionCreators)
		const doubleBoundActionCreators = {}
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i]
			const boundActionCreator = boundActionCreators[key]
			if (typeof boundActionCreator === 'function') {
				doubleBoundActionCreators[key] = (...args) => {
					if (args.length === 1) {
						return boundActionCreator(args[0], plugin, actionOptions)
					} else if (args.length === 2) {
						return boundActionCreator(args[0], args[1], actionOptions)
					}
					return undefined
				}
			}
		}
		boundPluginActionCreators[plugin.name + api + traceId] = doubleBoundActionCreators
		return doubleBoundActionCreators
	}
}


const initAPICallTracing = parentSpan => {
	const startSpan = (spanName, spanArgs = {}) => {
		const defaultSpanArgs = { childOf: parentSpan }
		return tracer.startSpan(spanName, _.merge(defaultSpanArgs, spanArgs))
	}
	return {
		tracer,
		parentSpan,
		startSpan
	}
}


/* const getLocalReporter = (activity, reporter) => (
	activity
		? { ...reporter, panicOnBuild: activity.panicOnBuild.bind(activity) }
		: reporter
) */


const runAPI = async (plugin, api, args, activity) => {
	const gatsbyNode = require(`${plugin.resolve}/gatsby-node`)
	if (gatsbyNode[api]) {
		const parentSpan = args && args.parentSpan
		const spanOptions = parentSpan ? { childOf: parentSpan } : {}
		const pluginSpan = tracer.startSpan('run-plugin', spanOptions)
		pluginSpan.setTag('api', api)
		pluginSpan.setTag('plugin', plugin.name)
		const {
			loadNodeContent,
			getNodes,
			getNode,
			getNodesByType,
			hasNodeChanged,
			getNodeAndSavePathDependency
		} = require('../nodes')
		const { publicActions, restrictedActionsAvailableInAPI } = require('../actions')
		const availableActions = {
			...publicActions,
			...(restrictedActionsAvailableInAPI[api] || {})
		}
		const boundActionCreators = bindActionCreators(availableActions, store.dispatch)
		const doubleBoundActionCreators = doubleBind(
			boundActionCreators,
			api,
			plugin,
			{ ...args, parentSpan: pluginSpan, activity }
		)
		const { config, program } = store.getState()
		const pathPrefix = (program.prefixPaths && config.pathPrefix) || ''
		const publicPath = getPublicPath({ ...config, ...program }, '')
		const namespacedCreateNodeId = id => createNodeId(id, plugin.name)
		const tracing = initAPICallTracing(pluginSpan)
		const cache = getCache(plugin.name)
		let actions = doubleBoundActionCreators
		let apiFinished = false
		if (api === 'createPages') {
			let alreadyDisplayed = false
			const createPageAction = actions.createPage
			actions = {
				...actions,
				createPage: (...args) => {
					createPageAction(...args)
					if (apiFinished && !alreadyDisplayed) {
						const warning = [
							/* reporter.stripIndent(`
								Action ${chalk.bold('createPage')} was called outside of its expected asynchronous lifecycle ${chalk.bold('createPages')} in ${chalk.bold(plugin.name)}.
								Ensure that you return a Promise from ${chalk.bold('createPages')} and are awaiting any asynchronous method invocations (like ${chalk.bold('graphql')} or http requests).
								For more info and debugging tips: see ${chalk.bold('https://gatsby.dev/sync-actions')}
							`) */
							`
								Action ${chalk.bold('createPage')} was called outside of its expected asynchronous lifecycle ${chalk.bold('createPages')} in ${chalk.bold(plugin.name)}.
								Ensure that you return a Promise from ${chalk.bold('createPages')} and are awaiting any asynchronous method invocations (like ${chalk.bold('graphql')} or http requests).
								For more info and debugging tips: see ${chalk.bold('https://gatsby.dev/sync-actions')}
							`
						]
						const possiblyCodeFrame = getNonGatsbyCodeFrameFormatted()
						if (possiblyCodeFrame) {
							warning.push(possiblyCodeFrame)
						}
						//reporter.warn(warning.join('\n\n'))
						console.error(warning.join('\n\n'))
						alreadyDisplayed = true
					}
				}
			}
		}
		//let localReporter = getLocalReporter(activity, reporter)
		const apiCallArgs = [
			{
				...args,
				basePath: pathPrefix,
				pathPrefix: publicPath,
				boundActionCreators: actions,
				actions,
				loadNodeContent,
				store,
				emitter,
				getCache,
				getNodes,
				getNode,
				getNodesByType,
				hasNodeChanged,
				//reporter: localReporter,
				getNodeAndSavePathDependency,
				cache,
				createNodeId: namespacedCreateNodeId,
				createContentDigest,
				tracing,
				schema: {
					buildObjectType,
					buildUnionType,
					buildInterfaceType,
					buildInputObjectType,
					buildEnumType,
					buildScalarType
				}
			},
			plugin.pluginOptions
		]
		if (gatsbyNode[api].length === 3) {
			return new Promise((resolve, reject) => {
				const cb = (err, val) => {
					pluginSpan.finish()
					apiFinished = true
					if (err) {
						reject(err)
					} else {
						resolve(val)
					}
				}
				try {
					gatsbyNode[api](...apiCallArgs, cb)
				} catch (e) {
					/* trackBuildError(api, {
						error: e,
						pluginName: `${plugin.name}@${plugin.version}`
					}) */
					throw e
				}
			})
		}
		const result = await gatsbyNode[api](...apiCallArgs)
		pluginSpan.finish()
		apiFinished = true
		return result
	}
	return null
}


const runPlugin = (api, plugin, args, stopQueuedApiRuns, activity, apiSpan) => {
	return new Promise(resolve => {
		resolve(runAPI(plugin, api, { ...args, parentSpan: apiSpan }, activity))
	}).catch(err => {
		let pluginName =
		plugin.name === 'default-site-plugin' ? 'gatsby-node.js' : plugin.name
		/* decorateEvent('BUILD_PANIC', {
			pluginName: `${plugin.name}@${plugin.version}`
		}) */
		/* let localReporter = getLocalReporter(activity, reporter)
		localReporter.panicOnBuild({
			id: '11321',
			context: {
				pluginName,
				api,
				message: err instanceof Error ? err.message : err
			},
			error: err instanceof Error ? err : undefined
		}) */
		throw new Error(`An error occurred in runner.js: ${err instanceof Error ? err.message : err}`)
		//return null
	})
}


let apiRunnersActive = 0
let apisRunningByTraceId = new Map()
let waitingForCasacadeToFinish = []


module.exports = async (api, args = {}, { pluginSource, activity } = {}) => {
	let resolve
	let promise = new Promise(res => (resolve = res))
	const { parentSpan, traceId, traceTags, waitForCascadingActions } = args
	const apiSpanArgs = parentSpan ? { childOf: parentSpan } : {}
	const apiSpan = tracer.startSpan('run-api', apiSpanArgs)
	apiSpan.setTag('api', api)
	_.forEach(traceTags, (value, key) => {
		apiSpan.setTag(key, value)
	})
	const plugins = store.getState().flattenedPlugins
	const implementingPlugins = plugins.filter(
		plugin => plugin.nodeAPIs.includes(api) && plugin.name !== pluginSource
	)
	const apiRunInstance = {
		api,
		resolve,
		span: apiSpan,
		traceId,
	}
	if (waitForCascadingActions) {
		waitingForCasacadeToFinish.push(apiRunInstance)
	}
	if (apiRunnersActive === 0) {
		emitter.emit('API_RUNNING_START')
	}
	++apiRunnersActive
	if (apisRunningByTraceId.has(apiRunInstance.traceId)) {
		const currentCount = apisRunningByTraceId.get(apiRunInstance.traceId)
		apisRunningByTraceId.set(apiRunInstance.traceId, currentCount + 1)
	} else {
		apisRunningByTraceId.set(apiRunInstance.traceId, 1)
	}
	let stopQueuedApiRuns = false
	let onAPIRunComplete = null
	if (api === 'onCreatePage') {
		const path = args.page.path
		const actionHandler = action => {
			if (action.payload.path === path) {
				stopQueuedApiRuns = true
			}
		}
		emitter.on('DELETE_PAGE', actionHandler)
		onAPIRunComplete = () => {
			emitter.off('DELETE_PAGE', actionHandler)
		}
	}
	let results = []
	for (const plugin of implementingPlugins) {
		if (stopQueuedApiRuns) {
			break
		}
		let result = await runPlugin(
			api,
			plugin,
			args,
			stopQueuedApiRuns,
			activity,
			apiSpan
		)
		results.push(result)
	}
	if (onAPIRunComplete) {
		onAPIRunComplete()
	}
	const currentCount = apisRunningByTraceId.get(apiRunInstance.traceId)
	apisRunningByTraceId.set(apiRunInstance.traceId, currentCount - 1)
	--apiRunnersActive
	if (apiRunnersActive === 0) {
		emitter.emit('API_RUNNING_QUEUE_EMPTY')
	}
	apiRunInstance.results = results.filter(result => !_.isEmpty(result))
	if (!waitForCascadingActions) {
		apiSpan.finish()
		resolve(apiRunInstance.results)
	}
	waitingForCasacadeToFinish = waitingForCasacadeToFinish.filter(instance => {
		const apisByTraceIdCount = apisRunningByTraceId.get(instance.traceId)
		if (apisByTraceIdCount === 0) {
			instance.span.finish()
			instance.resolve(instance.results)
			return false
		} else {
			return true
		}
	})
	return promise
}


