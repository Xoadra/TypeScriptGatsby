



//import { NetlifyError } from 'netlify-auth-providers'



export interface GitHubAuth {
	//token: string | null
	//error: Error | null
	authenticate(): void
	signout(): void
}



