



const { camelCase } = require('lodash')
/* const report = require('gatsby-cli/lib/reporter') */

const { parseTypeDef } = require('./type-defs')
const { reservedExtensionNames } = require('./schema-extensions')



const ALLOWED_IN = 'ALLOWED_IN'
const DEPRECATED_IN = 'DEPRECATED_IN'

const nodeAPIs = Object.keys(require('./api-node'))


const withDeprecationWarning = (actionName, action, api, allowedIn) => (...args) => {
	/* report.warn(
		`Calling '${actionName}' in the '${api}' API is deprecated. ` +
		`Please use: ${allowedIn.map(a => `'${a}'`).join(', ')}.`
	) */
	console.error(
		`Calling '${actionName}' in the '${api}' API is deprecated. ` +
		`Please use: ${allowedIn.map(a => `'${a}'`).join(', ')}.`
	)
	return action(...args)
}


const withErrorMessage = (actionName, api, allowedIn) => () => (
	() => {
		/* report.error(
			`'${actionName}' is not available in the '${api}' API. ` +
			`Please use: ${allowedIn.map(a => `'${a}'`).join(', ')}.`
		) */
		console.error(
			`'${actionName}' is not available in the '${api}' API. ` +
			`Please use: ${allowedIn.map(a => `'${a}'`).join(', ')}.`
		)
	}
)


const set = (availableActionsByAPI, api, actionName, action) => {
	availableActionsByAPI[api] = availableActionsByAPI[api] || {}
	availableActionsByAPI[api][actionName] = action
}


const mapAvailableActionsToAPIs = restrictions => {
	const availableActionsByAPI = {}
	const actionNames = Object.keys(restrictions)
	actionNames.forEach(actionName => {
		const action = actions[actionName]
		const allowedIn = restrictions[actionName][ALLOWED_IN] || []
		allowedIn.forEach(api => set(availableActionsByAPI, api, actionName, action))
		const deprecatedIn = restrictions[actionName][DEPRECATED_IN] || []
		deprecatedIn.forEach(api => set(
			availableActionsByAPI,
			api,
			actionName,
			withDeprecationWarning(actionName, action, api, allowedIn)
		))
		const forbiddenIn = nodeAPIs.filter(api => ![...allowedIn, ...deprecatedIn].includes(api))
		forbiddenIn.forEach(api => set(
			availableActionsByAPI,
			api,
			actionName,
			withErrorMessage(actionName, api, allowedIn)
		))
	})
	return availableActionsByAPI
}


const availableActionsByAPI = mapAvailableActionsToAPIs({
	createFieldExtension: {
		[ALLOWED_IN]: ['sourceNodes', 'createSchemaCustomization']
	},
	createTypes: {
		[ALLOWED_IN]: ['sourceNodes', 'createSchemaCustomization'],
		[DEPRECATED_IN]: ['onPreInit', 'onPreBootstrap']
	},
	createResolverContext: {
		[ALLOWED_IN]: ['createSchemaCustomization']
	},
	addThirdPartySchema: {
		[ALLOWED_IN]: ['sourceNodes', 'createSchemaCustomization'],
		[DEPRECATED_IN]: ['onPreInit', 'onPreBootstrap']
	},
	printTypeDefinitions: {
		[ALLOWED_IN]: ['createSchemaCustomization']
	}
})


const addThirdPartySchema = ({ schema }, plugin, traceId) => {
	return {
		type: 'ADD_THIRD_PARTY_SCHEMA',
		plugin,
		traceId,
		payload: schema
	}
}


const createTypes = (types, plugin, traceId) => {
	return {
		type: 'CREATE_TYPES',
		plugin,
		traceId,
		payload: Array.isArray(types) ? types.map(parseTypeDef) : parseTypeDef(types)
	}
}


const createFieldExtension = (extension, plugin, traceId) => (dispatch, getState) => {
	const { name } = extension || {}
	const { fieldExtensions } = getState().schemaCustomization
	if (!name) {
		//report.error('The provided field extension must have a \'name\' property.')
		console.error('The provided field extension must have a \'name\' property.')
	} else if (reservedExtensionNames.includes(name)) {
		//report.error(`The field extension name '${name}' is reserved for internal use.`)
		console.error(`The field extension name '${name}' is reserved for internal use.`)
	} else if (fieldExtensions[name]) {
		//report.error(`A field extension with the name '${name}' has already been registered.`)
		console.error(`A field extension with the name '${name}' has already been registered.`)
	} else {
		dispatch({
			type: 'CREATE_FIELD_EXTENSION',
			plugin,
			traceId,
			payload: {
				name,
				extension
			}
		})
	}
}


const printTypeDefinitions = (
	{
		path = 'schema.gql',
		include,
		exclude,
		withFieldTypes = true,
	},
	plugin,
	traceId
) => {
	return {
		type: 'PRINT_SCHEMA_REQUESTED',
		plugin,
		traceId,
		payload: {
			path,
			include,
			exclude,
			withFieldTypes
		}
	}
}


const createResolverContext = (context, plugin, traceId) => dispatch => {
	if (!context || typeof context !== 'object') {
		/* report.error(
			`Expected context value passed to 'createResolverContext' to be an object. Received "${context}".`
		) */
		console.error(
			`Expected context value passed to 'createResolverContext' to be an object. Received "${context}".`
		)
	} else {
		const { name } = plugin || {}
		const payload =
			!name || name === 'default-site-plugin'
				? context
				: { [camelCase(name.replace(/^gatsby-/, ''))]: context }
		dispatch({
			type: 'CREATE_RESOLVER_CONTEXT',
			plugin,
			traceId,
			payload
		})
	}
}


const actions = {
	addThirdPartySchema,
	createTypes,
	createFieldExtension,
	printTypeDefinitions,
	createResolverContext
}


module.exports = { actions, availableActionsByAPI }



