



import React from 'react'
import { Redirect } from '@reach/router'
import netlifyIdentity, { User } from 'netlify-identity-widget'



interface Props {
	path: string
	isAuthenticated: boolean
}


export default (props: Props) => {
	const user: User | null = netlifyIdentity.currentUser()
	return !props.isAuthenticated ? <Redirect to="/auth" noThrow/> : (
		<div>
			<h3>Private Page</h3>
			<p>You are logged in as <b>{user ? user.email : ''}</b></p>
		</div>
	)
}


