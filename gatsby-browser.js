



/**
 * Implement Gatsby's Browser APIs in this file.
 * 
 * See: https://www.gatsbyjs.org/docs/browser-apis/
 */

// You can delete this file if you're not using it


import React from 'react'
//import NetlifyIdentity from 'netlify-identity-widget'

import { AuthProvider } from './src/services/authcontext'
import { GitHubProvider } from './src/services/githubcontext'



//window.NetlifyIdentity = NetlifyIdentity
//NetlifyIdentity.init()


export const wrapRootElement = source => (
	<AuthProvider>
		<GitHubProvider>
			{source.element}
		</GitHubProvider>
	</AuthProvider>
)



