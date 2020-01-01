



import { NetlifyError } from 'netlify-auth-providers'



export interface GitHubAuth {
	token: string | null
	error: NetlifyError | null
	authenticate(): void
	signout(): void
}



