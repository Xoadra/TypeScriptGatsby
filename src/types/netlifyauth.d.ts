



import { User } from 'netlify-identity-widget'



export interface NetlifyAuth {
	isAuthenticated: boolean
	user: User | null
	authenticate(callback?: any): void
	signout(callback?: any): void
}



