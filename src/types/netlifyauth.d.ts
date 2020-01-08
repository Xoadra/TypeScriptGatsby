



import { User } from 'netlify-identity-widget'
import { NetlifyError } from 'netlify-auth-providers'



export interface NetlifyAuth {
	user: User | null
	token: string | null
	error: NetlifyError | null
	isAuthenticated: boolean
	toggle(open: boolean): void
	authenticate(callback: Function): void
	signout(callback: Function): void
}



