



import React, { Context, Dispatch, useState } from 'react'
import NetlifyIdentity, { User } from 'netlify-identity-widget'

import { NetlifyAuth } from '../types/netlifyauth'



const AuthContext: Context<NetlifyAuth> = React.createContext<NetlifyAuth>({
	isAuthenticated: false, user: null,
	authenticate: function(callback?: Function): void {},
	signout: function(callback?: Function): void {}
})


export default AuthContext

export const AuthProvider = (props: any) => {
	const { Provider }: Context<NetlifyAuth> = AuthContext
	const userIdentity: User | null = NetlifyIdentity.currentUser()
	const loginStatus: boolean = userIdentity ? true : false
	const [user, setUser]: [User | null, Dispatch<User | null>] = useState<User | null>(userIdentity)
	const [isAuthenticated, setIsAuthenticated]: [boolean, Dispatch<boolean>] = useState<boolean>(loginStatus)
	const authenticate = (callback: Function): void => {
		NetlifyIdentity.open()
		NetlifyIdentity.on('login', (user: User) => {
			setUser(user)
			callback(user)
			setIsAuthenticated(true)
			// Redirect to the CMS website after login
			// This doesn't appear to be working yet
			//location.href = '/identity'
		})
	}
	const signout = (callback: Function): void => {
		setIsAuthenticated(false)
		NetlifyIdentity.logout()
		NetlifyIdentity.on('logout', () => {
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



