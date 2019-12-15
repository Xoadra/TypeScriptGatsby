



const Redux = require('redux')
const _ = require('lodash')
const mitt = require('mitt')
const thunk = require('redux-thunk').default

const reducers = require('./reducers')
const { writeToCache, readFromCache } = require('./persist')



const emitter = mitt()


const readState = () => {
	try {
		const state = readFromCache()
		if (state.nodes) {
			state.nodesByType = new Map()
			state.nodes.forEach(node => {
				const { type } = node.internal
				if (!state.nodesByType.has(type)) {
					state.nodesByType.set(type, new Map())
				}
				state.nodesByType.get(type).set(node.id, node)
			})
		}
		delete state['jsonDataPaths']
		return state
	} catch (e) {}
	return {}
}


const multi = ({ dispatch }) => next => action =>
	Array.isArray(action) ? action.filter(Boolean).map(dispatch) : next(action)


const configureStore = initialState => Redux.createStore(
	Redux.combineReducers({ ...reducers }),
	initialState,
	Redux.applyMiddleware(thunk, multi)
)


const store = configureStore(readState())


const saveState = () => {
	const state = store.getState()
	const pickedState = _.pick(state, [
		'nodes',
		'status',
		'componentDataDependencies',
		'components',
		'staticQueryComponents',
		'webpackCompilationHash',
	])
	return writeToCache(pickedState)
}


store.subscribe(() => {
  const lastAction = store.getState().lastAction
  emitter.emit(lastAction.type, lastAction)
})


module.exports = {
	emitter,
	store,
	configureStore,
	readState,
	saveState
}



