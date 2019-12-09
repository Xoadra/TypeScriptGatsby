



import CMS from 'netlify-cms-app'
import { GitHubBackend, API, AuthenticationPage } from 'netlify-cms-backend-github'
import netlifyIdentity from 'netlify-identity-widget'

/* import { NewGitHubBackend } from './backend/github' */
import NewGitHubBackend from './backend/backend'
import ReposControl from './repos-control'
import ReposPreview from './repos-preview'



//CMS.registerBackend('github', GitHubBackend)
CMS.registerBackend('new-github', NewGitHubBackend)

//CMS.registerPreviewTemplate('repos', RepoPreview)
CMS.registerWidget('repos', ReposControl, ReposPreview)


const user = netlifyIdentity.currentUser()
console.log('USER', user)


CMS.init({
	config: {
		backend: {
			//name: 'git-gateway'
			name: 'new-github',
			//name: 'github',
			repo: 'Xoadra/TypeScriptGatsby'
		},
		load_config_file: false,
		publish_mode: 'editorial_workflow',
		media_folder: 'static/images',
		public_folder: 'images',
		collections: [
			{
				label: 'Repos',
				name: 'repos',
				folder: 'content/repos',
				create: true,
				fields: [
					{ label: 'Title', name: 'title', widget: 'string' },
					{ label: 'Body', name: 'body', widget: 'markdown' }
				]
			}
		]
	}
})


console.log('\n\nCMS: 1\n\n', GitHubBackend, '\n\n', NewGitHubBackend, '\n\n\n')
/* console.log(GitHubBackend.prototype.constructor) */



