



/* const { bindActionCreators } = require('redux') */

/* const { store } = require('./redux/store') */
const { actions: internalActions } = require('./toolkit/internal')
const { actions: publicActions } = require('./toolkit/public')
const { actions: restrictedActions, availableActionsByAPI } = require('./toolkit/restricted')



const actions = {
	...internalActions,
	...publicActions,
	...restrictedActions
}


module.exports = {
	internalActions,
	publicActions,
	restrictedActions,
	restrictedActionsAvailableInAPI: availableActionsByAPI,
	actions,
	// Deprecated, remove in v3
	//boundActionCreators: bindActionCreators(actions, store.dispatch)
}


