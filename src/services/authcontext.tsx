



import React, { Context, Dispatch, useState } from 'react'
import netlifyIdentity, { User } from 'netlify-identity-widget'

import { NetlifyAuth } from '../types/netlifyauth'



const AuthContext = React.createContext<NetlifyAuth>({
	isAuthenticated: false, user: null,
	authenticate: function(callback?: any): void {},
	signout: function(callback?: any): void {}
})


export default AuthContext

export const AuthProvider = (props: any) => {
	const { Provider }: Context<NetlifyAuth> = AuthContext
	const loginState: boolean = netlifyIdentity.currentUser() ? true : false
	const [user, setUser]: [User | null, Dispatch<any>] = useState(netlifyIdentity.currentUser())
	const [isAuthenticated, setIsAuthenticated]: [boolean, Dispatch<any>] = useState(loginState)
	const authenticate = (callback: any): void => {
		netlifyIdentity.open()
		netlifyIdentity.on('login', (user: User) => {
			setUser(user)
			callback(user)
			setIsAuthenticated(true)
		})
	}
	const signout = (callback: any): void => {
		setIsAuthenticated(false)
		netlifyIdentity.logout()
		netlifyIdentity.on('logout', () => {
			setUser(null)
			callback(user)
		})
	}
	const netlifyAuth: NetlifyAuth = { user, isAuthenticated, authenticate, signout }
	return (
		<Provider value={netlifyAuth}>
			{props.children}
		</Provider>
	)
}



