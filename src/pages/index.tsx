



import React from 'react'
import { Link } from 'gatsby'

import Layout from '../components/layout'
import Image from '../components/image'
import SEO from '../components/seo'



export default () => {
	//const user: string = 'Xoadra'
	const user: string = 'junior-dev-struggle-bus'
	//const source: string = 'IanPortfolio/contents/README.md'
	const source: string = 'juniordevstrugglebus/contents/README.md'
	const api: string = `https://api.github.com/repos/${user}/${source}`
	// The headers variable still needs to be typed
	const headers = { 'Accept': 'application/vnd.github.v3+json' }
	const request: Request = new Request(api, { method: 'GET', headers })
	fetch(request).then(data => data.json()).then(json => {
		console.log(atob(json.content))
		console.log(Buffer.from(json.content, 'base64').toString('utf-8'))
	})
	return (
		<Layout>
			<SEO title="Home"/>
			<h1>Hi people</h1>
			<p>Welcome to your new Gatsby site.</p>
			<p>Now go build something great.</p>
			<div style={{ maxWidth: '300px', marginBottom: '1.45rem' }}>
				<Image/>
			</div>
			<Link to="/page-2">Go to Page 2</Link>
		</Layout>
	)
}


