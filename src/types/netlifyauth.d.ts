



import { User } from 'netlify-identity-widget'
import { NetlifyError } from 'netlify-auth-providers'



export interface NetlifyAuth {
	user: User | null
	token: string | null
	error: NetlifyError | null
	isAuthenticated: boolean
	authenticate(callback?: any): void
	signout(callback?: any): void
}


