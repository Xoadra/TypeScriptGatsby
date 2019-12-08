



import React, { Context, Dispatch, useState, useEffect } from 'react'
import netlifyIdentity, { User } from 'netlify-identity-widget'
import Authenticator from 'netlify-auth-providers'

import { GitHubAuth } from '../types/githubauth'



const GitHubContext = React.createContext<GitHubAuth>({
	token: null, error: null,
	authenticate: function(): void {},
	signout: function(): void {}
})


export default GitHubContext

export const GitHubProvider = (props: any) => {
	const { Provider }: Context<GitHubAuth> = GitHubContext
	const user: User | null = netlifyIdentity.currentUser()
	const [token, setToken]: [string | null, Dispatch<any>] = useState(
		user && user.token ? user.token.access_token : localStorage.getItem('github-token')
	)
	const [error, setError]: [Error | null, Dispatch<any>] = useState(null)
	const scopes: Array<string> = ['public_repo', 'read:org', 'read:user']
	const authenticate = (): void => {
		const config: object = { site_id: process.env.NETLIFY_SITE_ID }
		const authenticator = new Authenticator(config)
		const options = { provider: 'github', scope: scopes.join(',') }
		authenticator.authenticate(options, (error: Error, data: { token: string }) => {
			if (error) {
				console.error('An error in GitHubProvider!', error)
				setError(error)
			} else {
				localStorage.setItem('github-token', data.token)
				setToken(data.token)
			}
		})
	}
	const signout = (): void => {
		localStorage.removeItem('github-token')
		setToken(null)
		setError(null)
	}
	useEffect(() => {
		if (token) {
			setToken(token)
		}
	}, [token])
	const gitHubAuth: GitHubAuth = { token, error, authenticate, signout }
	return (
		<Provider value={gitHubAuth}>
			{props.children}
		</Provider>
	)
}



