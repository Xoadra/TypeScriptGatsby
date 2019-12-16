



const createPageDependency = ({ path, nodeId, connection }, plugin = '') => {
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


const deleteComponentsDependencies = paths => {
	return {
		type: 'DELETE_COMPONENTS_DEPENDENCIES',
		payload: {
			paths
		}
	}
}


const replaceComponentQuery = ({ query, componentPath }) => {
	return {
		type: 'REPLACE_COMPONENT_QUERY',
		payload: {
			query,
			componentPath
		}
	}
}


const replaceStaticQuery = (args, plugin = null) => {
	return {
		type: 'REPLACE_STATIC_QUERY',
		plugin,
		payload: args
	}
}


const queryExtracted = ({ componentPath, query }, plugin, traceId = '') => {
	return {
		type: 'QUERY_EXTRACTED',
		plugin,
		traceId,
		payload: {
			componentPath,
			query
		}
	}
}


const queryExtractionGraphQLError = ({ componentPath, error }, plugin, traceId = '') => {
	return {
		type: 'QUERY_EXTRACTION_GRAPHQL_ERROR',
		plugin,
		traceId,
		payload: {
			componentPath,
			error
		}
	}
}


const queryExtractedBabelSuccess = ({ componentPath }, plugin, traceId = '') => {
	return {
		type: 'QUERY_EXTRACTION_BABEL_SUCCESS',
		plugin,
		traceId,
		payload: {
			componentPath
		}
	}
}


const queryExtractionBabelError = ({ componentPath, error }, plugin, traceId = '') => {
	return {
		type: 'QUERY_EXTRACTION_BABEL_ERROR',
		plugin,
		traceId,
		payload: {
			componentPath,
			error
		}
	}
}


const setProgramStatus = (status, plugin, traceId = '') => {
	return {
		type: 'SET_PROGRAM_STATUS',
		plugin,
		traceId,
		payload: status
	}
}


const pageQueryRun = ({ path, componentPath, isPage }, plugin, traceId = '') => {
	return {
		type: 'PAGE_QUERY_RUN',
		plugin,
		traceId,
		payload: {
			path,
			componentPath,
			isPage
		}
	}
}


const actions = {
	createPageDependency,
	deleteComponentsDependencies,
	replaceComponentQuery,
	replaceStaticQuery,
	queryExtracted,
	queryExtractionGraphQLError,
	queryExtractedBabelSuccess,
	queryExtractionBabelError,
	setProgramStatus,
	pageQueryRun
}


module.exports = { actions }


