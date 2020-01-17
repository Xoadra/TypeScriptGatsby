



import React, { ReactNode, Context, Dispatch, useState, useEffect } from 'react'
import NetlifyIdentity, { User } from 'netlify-identity-widget'
import Authenticator, { Config, Options, NetlifyError, Data } from 'netlify-auth-providers'

import { GitHubAuth } from '../types/githubauth'



interface Props {
	children: ReactNode
}


const GitHubContext: Context<GitHubAuth> = React.createContext<GitHubAuth>({
	token: null, error: null,
	authenticate: (): void => {},
	signout: (): void => {}
})


export default GitHubContext

export const GitHubProvider = (props: Props) => {
	const { Provider }: Context<GitHubAuth> = GitHubContext
	const user: User | null = NetlifyIdentity.currentUser()
	const [token, setToken]: [string | null, Dispatch<string | null>] = useState<string | null>(
		user?.token?.access_token || localStorage.getItem('github-token')
	)
	const [error, setError]: [NetlifyError | null, Dispatch<NetlifyError | null>] = useState<NetlifyError | null>(null)
	const scoping: string[] = ['public_repo', 'read:org', 'read:user']
	const authenticate = (): void => {
		const config: Config = { site_id: process.env.NETLIFY_SITE_ID }
		const authenticator: Authenticator = new Authenticator(config)
		const options: Options = { provider: 'github', scope: scoping.join(',') }
		authenticator.authenticate(options, (error: NetlifyError | null, data: Data) => {
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


