



import React, { ReactNode, Context, Dispatch, useState, useEffect } from 'react'
//import NetlifyIdentity, { User } from 'netlify-identity-widget'
//import Authenticator, { Config, Options, NetlifyError, Data } from 'netlify-auth-providers'
import GoTrue, { User } from 'gotrue-js'

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
	//const userIdentity: User | null = NetlifyIdentity.currentUser()
	const userIdentity: User | null = goTrue.currentUser()
	const loginStatus: boolean = userIdentity ? true : false
	const accessToken: string | null = localStorage.getItem('github-token')
	const [user, setUser]: [User | null, Dispatch<User | null>] = useState<User | null>(userIdentity)
	const [token, setToken]: [string | null, Dispatch<string | null>] = useState<string | null>(accessToken)
	//const [error, setError]: [NetlifyError | null, Dispatch<NetlifyError | null>] = useState<NetlifyError | null>(null)
	const [error, setError]: [any, Dispatch<any>] = useState<any>(null)
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
		} catch (failure) {
			setError(failure)
			console.error(`Error sending recovery mail: ${failure}`)
			callback(failure, null)
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
		} catch (failure) {
			setError(failure)
			console.error(`Error signing up user: ${error}`)
			callback(failure, null)
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
			// Redirect to the CMS website after login
			// This doesn't appear to be working yet
			//window.location.href = '/identity'
		}) */
		try {
			const identity: User = await goTrue.login(...data)
			console.log('Success!', identity)
			setUser(identity)
			setIsAuthenticated(true)
			callback(null, identity)
		} catch (failure) {
			setError(failure)
			const issue: string = error?.json.error_description || error.message
			console.error(`Error logging in user: ${issue}`)
			callback(failure, null)
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
			callback(null, absent)
		} catch (failure) {
			setError(failure)
			const issue: string = error?.json.error_description || error.message
			console.error(`Error logging out user: ${issue}`)
			callback(failure, null)
		} finally {
			action()
		}
	}
	const provider = async (hash: string, callback: Function): Promise<void> => {
		const params: Token = hash.split('&').reduce((body: object, pair: string) => {
			const [key, value]: string[] = pair.split('=')
			return { ...body, [key]: value }
		}, {})
		if (!!document && params['access_token']) {
			document.cookie = `nf_jwt=${params['access_token']}`
		}
		if (params['state']) {
			try {
				const state: string = decodeURIComponent(params['state'])
				const { auth_type }: { auth_type: string } = JSON.parse(state)
				if (auth_type === 'implicit') {
					return
				}
			} catch (error) {}
		}
		// Prevents redirection to Netlify CMS after provider login
		document.location.hash = ''
		setIsToggled(true)
		try {
			const provision: User = await goTrue.createUser(params, true)
			console.log('Success!', provision)
			setUser(provision)
			setIsAuthenticated(true)
		} catch (failure) {
			setError(failure)
			console.error(`Error provisioning git user: ${failure}`)
		} finally {
			callback()
		}
	}
	useEffect(() => {
		console.log('Loaded context!', document.location.hash)
		const hash: string = (document.location.hash || '').replace(/^#\/?/, '')
		if (hash.match(/access_token=/)) {
			provider(hash, () => {
				// Bugs out when immediately logging out via identity widget popup after logging in
				// Will need to implement a custom authentication widget to make this work consistently
				//NetlifyIdentity.on('close', () => {})
				/* if (!token && isAuthenticated) {
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
				} */
			})
		}
		console.log('Context user...', user)
	}, [])
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


