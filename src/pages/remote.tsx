



import React, { MouseEvent, useContext } from 'react'
import { Link, graphql } from 'gatsby'
import Authenticator from 'netlify-auth-providers'

import Layout from '../components/layout'
import SEO from '../components/seo'
import Document from '../components/document'
import AuthContext from '../services/auth'
import { Remark } from '../types/remark'



interface Props {
	data: Remark
}


export default (props: Props) => {
	const authenticator = useContext(AuthContext)
	const { user, setUser } = authenticator
	console.log(user, authenticator)
	return (
		<Layout>
			<SEO title="Remote"/>
			<h1>Hi from the remote document</h1>
			<p>Welcome to the Remote Page</p>
			<Link to="/">Home</Link>
			<a href="#" onClick={(event: MouseEvent) => {
				event.preventDefault()
				authenticator.authenticate((user: any) => setUser(user))
			}}>Login</a>
			<a href="#" onClick={(event: MouseEvent) => {
				event.preventDefault()
				authenticator.signout((user: any) => setUser(user))
			}}>Logout</a>
			<a href="#" onClick={(event: MouseEvent) => {
				event.preventDefault()
				const config: object = { site_id: 'https://ts-gatsby-github.netlify.com/' }
				const authenticator = new Authenticator(config)
				const options: object = { provider: 'github', scope: 'user' }
				authenticator.authenticate(options, (error: any, data: any) => {
					if (error) {
						return console.error(`Error Authenticating with GitHub: ${error}`)
					}
					console.log(`Authenticated with GitHub. Access Token: ${data.token}`)
				})
			}}>GitHub</a>
			<Document html={props.data.markdownRemark.html}/>
		</Layout>
	)
}


export const query = graphql`
	query {
		markdownRemark(fileAbsolutePath: { eq: null }) {
			html
		}
	}
`



