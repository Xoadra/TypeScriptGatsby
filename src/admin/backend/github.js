



/* import { GitHubBackend as SourceBackend } from 'netlify-cms-backend-github' */
import { GitHubBackend, API, AuthenticationPage } from 'netlify-cms-backend-github'
import NewGitHubBackend from './backend'



/* const { GitHubBackend, API, AuthenticationPage } = SourceBackend */


/* class NewGitHubBackend extends GitHubBackend {
	
	constructor(config, options = {}) {
		super(config, options)
		console.log('BACKEND', config)
	}
	
} */


/* NewBackend.prototype.constructor = function(config: any, options = {}) {
	super(config, options)
	console.log('BACKEND', config)
} */


/* export default { NewBackend, API, AuthenticationPage } */
export const NetlifyCmsBackendGithub = { GitHubBackend, API, AuthenticationPage }
export { NewGitHubBackend, API, AuthenticationPage }



