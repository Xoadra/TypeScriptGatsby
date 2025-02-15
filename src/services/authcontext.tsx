



import React, { ReactNode, Context, Dispatch, useState, useEffect } from 'react'
//import NetlifyIdentity, { User } from 'netlify-identity-widget'
//import Authenticator, { Config, Options, NetlifyError, Data } from 'netlify-auth-providers'
import GoTrue, { User } from 'gotrue-js'
import axios, { AxiosResponse } from 'axios'

import Modal from '../components/modal'
import { NetlifyAuth, SignupData, LoginData, Token } from '../types/netlifyauth'



interface Props {
	children: ReactNode
}


const AuthContext: Context<NetlifyAuth> = React.createContext<NetlifyAuth>({
	user: null, token: null, error: null, isAuthenticated: false, isToggled: false,
	toggle: (open: boolean, callback?: Function): void => {},
	recover: (email: string, callback: Function): void => {},
	signup: (data: SignupData, callback: Function): void => {},
	authenticate: (data: LoginData, callback: Function): void => {},
	logout: (callback: Function): void => {},
	provider: (hash: string, callback: Function): void => {}
})


export default AuthContext

export const AuthProvider = (props: Props) => {
	const { Provider }: Context<NetlifyAuth> = AuthContext
	const goTrue: GoTrue = new GoTrue({ APIUrl: 'https://ts-gatsby-github.netlify.com/.netlify/identity' })
	const userIdentity: User | null = goTrue.currentUser()
	const loginStatus: boolean = userIdentity ? true : false
	const accessToken: string | null = userIdentity ? localStorage.getItem('github-token') : null
	const [user, setUser]: [User | null, Dispatch<User | null>] = useState<User | null>(userIdentity)
	const [token, setToken]: [string | null, Dispatch<string | null>] = useState<string | null>(accessToken)
	const [error, setError]: [Error | null, Dispatch<Error | null>] = useState<Error | null>(null)
	const [action, setAction]: [Function, Dispatch<Function>] = useState<Function>(() => () => {})
	const [isAuthenticated, setIsAuthenticated]: [boolean, Dispatch<boolean>] = useState<boolean>(loginStatus)
	const [isToggled, setIsToggled]: [boolean, Dispatch<boolean>] = useState<boolean>(false)
	const toggle = (open: boolean, callback?: Function): void => {
		setIsToggled(open)
		if (callback) {
			setAction(() => callback)
		}
	}
	const recover = async (email: string, callback: Function): Promise<void> => {
		try {
			const recovery: void = await goTrue.requestPasswordRecovery(email)
			console.log('Success!', recovery)
			callback(null, recovery)
		} catch (issue) {
			setError(issue)
			console.error(`Error sending recovery mail: ${issue}`)
			callback(issue, null)
		} finally {
			action()
		}
	}
	const signup = async (data: SignupData, callback: Function): Promise<void> => {
		try {
			const creation: User = await goTrue.signup(...data)
			console.log('Success!', creation)
			callback(null, creation)
			// If autoconfirming signups is desired, add a user login step here
		} catch (issue) {
			setError(issue)
			console.error(`Error signing up user: ${issue}`)
			callback(issue, null)
		} finally {
			action()
		}
	}
	const authenticate = async (data: LoginData, callback: Function): Promise<void> => {
		/* NetlifyIdentity.open()
		NetlifyIdentity.on('login', (user: User) => {
			setUser(user)
			callback(user)
			setIsAuthenticated(error ? true : false)
		}) */
		try {
			const identity: User = await goTrue.login(...data)
			console.log('Success!', identity)
			setUser(identity)
			setIsAuthenticated(true)
			// Redirect to the CMS website after login
			// This doesn't appear to be working yet
			//location.href = '/identity'
			callback(null, identity)
		} catch (issue) {
			setError(issue)
			const report: string = issue?.json.error_description || issue.message
			console.error(`Error logging in user: ${report}`)
			callback(issue, null)
		} finally {
			action()
		}
	}
	const logout = async (callback: Function): Promise<void> => {
		/* NetlifyIdentity.logout()
		NetlifyIdentity.on('logout', () => {
			setUser(null)
			localStorage.removeItem('github-token')
			setToken(null)
			setError(null)
			callback()
			setIsAuthenticated(false)
		}) */
		try {
			const absent: void = await goTrue.currentUser()?.logout()
			console.log('Success!', absent)
			setUser(null)
			setIsAuthenticated(false)
			localStorage.removeItem('github-token')
			setToken(null)
			callback(null, absent)
		} catch (issue) {
			setError(issue)
			const report: string = issue?.json.error_description || issue.message
			console.error(`Error logging out user: ${report}`)
			callback(issue, null)
		} finally {
			action()
		}
	}
	const provider = async (hash: string, callback: Function): Promise<void> => {
		const params: Token = hash.split('&').reduce((body: object, pair: string) => {
			const [key, value]: string[] = pair.split('=')
			return { ...body, [key]: value }
		}, {})
		if (!!document && params.access_token) {
			document.cookie = `nf_jwt=${params.access_token}`
		}
		if (params.state) {
			try {
				const state: string = decodeURIComponent(params.state)
				const { auth_type }: { auth_type: string } = JSON.parse(state)
				if (auth_type === 'implicit') {
					return
				}
			} catch (error) {}
		}
		// Prevents redirection to Netlify CMS after provider login
		document.location.hash = ''
		if (!isAuthenticated) {
			try {
				const provision: User = await goTrue.createUser(params, true)
				console.log('Success!', provision)
				setUser(provision)
				setIsAuthenticated(true)
				// Obtain a GitHub access token for using GitHub's API
				const query: AxiosResponse = await axios.get('/.netlify/functions/client')
				location.href = `https://github.com/login/oauth/authorize?${query.data}`
			} catch (issue) {
				setError(issue)
				console.error(`Error provisioning GitHub user identity: ${issue}`)
			}
		} else {
			try {
				callback(null, params)
			} catch (issue) {
				callback(issue, null)
			}
			setIsToggled(true)
		}
	}
	useEffect(() => {
		const hash: string = (document.location.hash || '').replace(/^#\/?/, '')
		if (hash.match(/access_token=/)) {
			provider(hash, (issue: any, data: any) => {
				//NetlifyIdentity.on('close', () => {})
				console.log('Provider callback!', data, token)
				if (issue) {
					console.error(`Unable to obtain GitHub provider token: ${issue}`)
					setError(issue)
				} else {
					localStorage.setItem('github-token', data.access_token)
					setToken(data.access_token)
				}
			})
		}
		console.log('Context user...', user, token)
	}, [user, token])
	const netlifyAuth: NetlifyAuth = {
		user, token, error, isAuthenticated, isToggled, toggle, recover, signup, authenticate, logout, provider
	}
	return (
		<Provider value={netlifyAuth}>
			{isToggled && <Modal authenticator={goTrue} {...netlifyAuth}/>}
			{props.children}
		</Provider>
	)
}



