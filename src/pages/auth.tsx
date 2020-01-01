



import React, { Dispatch, useState, useContext } from 'react'
import { Router, Redirect } from '@reach/router'
import { Link } from 'gatsby'
import { User } from 'netlify-identity-widget'

import Layout from '../components/layout'
import SEO from '../components/seo'
import Public from './auth/public'
import Private from './auth/private'
import GitHub from './auth/github'
import AuthContext from '../services/authcontext'
import { Location } from '../types/location'
import { NetlifyAuth } from '../types/netlifyauth'



interface Props {
	location: Location
	navigate(to: string, options?: object): Promise<string>
}


export default (props: Props) => {
	const authenticator: NetlifyAuth = useContext<NetlifyAuth>(AuthContext)
	const [redirectToReferrer, setRedirectToReferrer]: [boolean, Dispatch<boolean>] = useState<boolean>(false)
	const { user, token }: { user: User | null, token: string | null } = authenticator
	const { isAuthenticated }: { isAuthenticated: boolean } = authenticator
	return redirectToReferrer ? <Redirect to="/auth"/> : (
		<Layout>
			<SEO title="Auth"/>
			{!isAuthenticated ? (
				<p>
					You are not logged in.{' '}
					<button onClick={() => {
						// Page refresh bugs out the layout if logging in from public page
						authenticator.authenticate(() => setRedirectToReferrer(true))
					}}>Log In</button>
				</p>
			) : (
				<p>
					Welcome!{' '}
					<button onClick={() => {
						authenticator.signout(() => props.navigate(props.location.pathname))
					}}>Sign Out</button>
				</p>
			)}
			<Link to="/">Home</Link>
			<Link to="/auth">Auth</Link>
			<Link to="/auth/public">Public</Link>
			<Link to="/auth/private">Private</Link>
			<Link to="/auth/github">GitHub</Link>
			<Router>
				<Public path="/auth/public"/>
				<Private path="/auth/private" user={user} token={token} isAuthenticated={isAuthenticated}/>
				<GitHub path="/auth/github"/>
			</Router>
		</Layout>
	)
}


