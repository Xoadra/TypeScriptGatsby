



import React, { ReactNode, Context, Dispatch, useState, useEffect } from 'react'
import NetlifyIdentity, { User } from 'netlify-identity-widget'
import Authenticator, { Config, Options, NetlifyError, Data } from 'netlify-auth-providers'

import Modal from '../components/modal'
import { NetlifyAuth } from '../types/netlifyauth'



interface Props {
	children: ReactNode
}


const AuthContext: Context<NetlifyAuth> = React.createContext<NetlifyAuth>({
	user: null, token: null, error: null, isAuthenticated: false,
	toggle: function(open: boolean): void {},
	authenticate: function(callback: Function): void {},
	signout: function(callback: Function): void {}
})


export default AuthContext

export const AuthProvider = (props: Props) => {
	const { Provider }: Context<NetlifyAuth> = AuthContext
	const userIdentity: User | null = NetlifyIdentity.currentUser()
	const loginStatus: boolean = userIdentity ? true : false
	const accessToken: string | null = localStorage.getItem('github-token')
	const [user, setUser]: [User | null, Dispatch<User | null>] = useState<User | null>(userIdentity)
	const [token, setToken]: [string | null, Dispatch<string | null>] = useState<string | null>(accessToken)
	const [error, setError]: [NetlifyError | null, Dispatch<NetlifyError | null>] = useState<NetlifyError | null>(null)
	const [isAuthenticated, setIsAuthenticated]: [boolean, Dispatch<boolean>] = useState<boolean>(loginStatus)
	const [isToggled, setIsToggled]: [boolean, Dispatch<boolean>] = useState<boolean>(false)
	const toggle = (open: boolean) => setIsToggled(open)
	const authenticate = (callback: Function): void => {
		NetlifyIdentity.open()
		NetlifyIdentity.on('login', (user: User) => {
			setUser(user)
			callback(user)
			setIsAuthenticated(error ? true : false)
			// Redirect to the CMS website after login
			// This doesn't appear to be working yet
			//location.href = '/identity'
		})
	}
	const signout = (callback: Function): void => {
		NetlifyIdentity.logout()
		NetlifyIdentity.on('logout', () => {
			setUser(null)
			localStorage.removeItem('github-token')
			setToken(null)
			setError(null)
			callback()
			setIsAuthenticated(false)
		})
	}
	useEffect(() => {
		// Bugs out when immediately logging out via identity widget popup after logging in
		// Will need to implement a custom authentication widget to make this work consistently
		NetlifyIdentity.on('close', () => {
			if (!token && isAuthenticated) {
				const config: Config = { site_id: process.env.NETLIFY_SITE_ID }
				const authenticator: Authenticator = new Authenticator(config)
				const scoping: string[] = ['public_repo', 'read:org', 'read:user']
				const options: Options = { provider: 'github', scope: scoping.join(',') }
				authenticator.authenticate(options, (error: NetlifyError | null, data: Data) => {
					if (error) {
						console.error('An error in GitHubProvider!', error)
						setError(error)
					} else {
						localStorage.setItem('github-token', data.token)
						setToken(data.token)
					}
					setIsAuthenticated(error ? false : true)
				})
			}
		})
	}, [])
	const netlifyAuth: NetlifyAuth = { user, token, error, isAuthenticated, toggle, authenticate, signout }
	return (
		<Provider value={netlifyAuth}>
			{isToggled && <Modal isToggled={isToggled} toggle={toggle}/>}
			{props.children}
		</Provider>
	)
}


