



//import { User } from 'netlify-identity-widget'
//import { NetlifyError } from 'netlify-auth-providers'
import { User } from 'gotrue-js'



export type SignupData = [string, string, object]
export type LoginData = [string, string, boolean]


export interface Token {
	access_token?: string
	expires_in?: string
	refresh_token?: string
	token_type?: 'bearer'
	state?: string
}


export interface NetlifyAuth {
	user: User | null
	token: string | null
	error: Error | null
	isAuthenticated: boolean
	isToggled: boolean
	toggle(open: boolean, callback?: Function): void
	recover(email: string, callback: Function): void
	signup(data: SignupData, callback: Function): void
	authenticate(data: LoginData, callback: Function): void
	logout(callback: Function): void
	provider(hash: string, callback: Function): void
}



