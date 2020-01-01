



import React, { MouseEvent } from 'react'
import { Link, graphql } from 'gatsby'
import Authenticator, { Config, Options, NetlifyError, Data } from 'netlify-auth-providers'

import Layout from '../components/layout'
import SEO from '../components/seo'
import Document from '../components/document'
import { Remark } from '../types/remark'



interface Props {
	data: Remark
}


export default (props: Props) => (
	<Layout>
		<SEO title="Remote"/>
		<h1>Hi from the remote document</h1>
		<p>Welcome to the Remote Page</p>
		<Link to="/">Home</Link>
		<a href="#" onClick={(event: MouseEvent) => {
			event.preventDefault()
			const config: Config = { site_id: process.env.NETLIFY_SITE_ID }
			const authenticator: Authenticator = new Authenticator(config)
			const options: Options = { provider: 'github', scope: 'user' }
			authenticator.authenticate(options, (error: NetlifyError | null, data: Data) => {
				if (error) {
					return console.error(`Error Authenticating with GitHub: ${error}`)
				}
				console.log(`Authenticated with GitHub. Access Token: ${data.token}`)
			})
		}}>GitHub</a>
		<Document html={props.data.markdownRemark.html}/>
	</Layout>
)


export const query = graphql`
	query {
		markdownRemark(fileAbsolutePath: { eq: null }) {
			html
		}
	}
`



